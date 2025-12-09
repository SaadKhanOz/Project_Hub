<?php
session_start();
require_once '../config/database.php';

// Set headers
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

// Check if project ID is provided
if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'No project ID provided']);
    exit;
}

$projectId = intval($_GET['id']);

try {
    // Check database connection
    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // Get project details with creator's name
    $query = "SELECT p.*, u.full_name as creator_name 
              FROM projects p 
              LEFT JOIN users u ON p.user_id = u.user_id 
              WHERE p.project_id = ?";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $stmt->bind_param("i", $projectId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }

    $result = $stmt->get_result();
    
    if (!$result) {
        throw new Exception("Failed to get result: " . $stmt->error);
    }

    if ($row = $result->fetch_assoc()) {
        $response = [
            'success' => true,
            'project' => [
                'project_id' => $row['project_id'],
                'project_name' => $row['project_name'],
                'description' => $row['description'],
                'user_id' => $row['user_id'],
                'creator_name' => $row['creator_name'],
                'created_at' => $row['created_at']
            ]
        ];
        
        // Make sure to encode with proper options
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Project not found'
        ]);
    }

} catch (Exception $e) {
    error_log("Error in get_project_details.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load project details: ' . $e->getMessage()
    ]);
}

// Make sure nothing else is output
exit;
?> 