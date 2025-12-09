<?php
session_start();
require_once '../config/database.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

// Get project ID from query string
$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;

if (empty($projectId)) {
    echo json_encode(['status' => 'error', 'message' => 'Project ID is required']);
    exit;
}

try {
    // Check if db_config.php was included properly
    if (!function_exists('mysqli_connect')) {
        throw new Exception("MySQLi not available");
    }

    // Check database connection
    if (!isset($conn)) {
        throw new Exception("Database connection not established. Check database.php");
    }

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Log project ID and user ID for debugging
    error_log("Checking access for Project ID: " . $projectId . ", User ID: " . $_SESSION['user_id']);

    // First check if user has access to this project (either as owner or member)
    $access_check = $conn->prepare("
        SELECT COUNT(*) as access_count
        FROM projects p 
        LEFT JOIN project_members pm ON p.project_id = pm.project_id 
        WHERE p.project_id = ? AND (p.user_id = ? OR pm.user_id = ?)
    ");
    
    if (!$access_check) {
        throw new Exception("Access check prepare failed: " . $conn->error);
    }
    
    $access_check->bind_param('iii', $projectId, $_SESSION['user_id'], $_SESSION['user_id']);
    $access_check->execute();
    $access_result = $access_check->get_result();
    $access_row = $access_result->fetch_assoc();
    
    if ($access_row['access_count'] == 0) {
        echo json_encode(['status' => 'error', 'message' => 'Access denied']);
        exit;
    }

    // Get pending invites for the project
    $invite_query = $conn->prepare("
        SELECT i.invite_id, i.email, i.created_at, u.full_name as invited_by_name 
        FROM invites i 
        INNER JOIN users u ON i.invited_by = u.user_id 
        WHERE i.project_id = ? AND i.status = 'pending'
        ORDER BY i.created_at DESC
    ");

    if (!$invite_query) {
        throw new Exception("Invite query prepare failed: " . $conn->error);
    }

    $invite_query->bind_param('i', $projectId);
    
    if (!$invite_query->execute()) {
        throw new Exception("Invite query execution failed: " . $invite_query->error);
    }
    
    $result = $invite_query->get_result();

    $invites = [];
    while ($row = $result->fetch_assoc()) {
        $invites[] = [
            'invite_id' => $row['invite_id'],
            'email' => $row['email'],
            'invited_by' => $row['invited_by_name'],
            'created_at' => $row['created_at']
        ];
    }

    echo json_encode([
        'status' => 'success',
        'invites' => $invites
    ]);

} catch (Exception $e) {
    error_log("Error in get_pending_invites.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to load pending invites: ' . $e->getMessage()
    ]);
} 