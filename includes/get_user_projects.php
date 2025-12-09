<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if database.php exists in the config directory
if (!file_exists(__DIR__ . '/../config/database.php')) {
    error_log('database.php not found in: ' . __DIR__ . '/../config/');
    echo json_encode([
        'success' => false,
        'message' => 'Database configuration not found'
    ]);
    exit;
}

require_once '../config/database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

try {
    // Check database connection
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? 'Connection not established'));
    }

    $userId = $_SESSION['user_id'];
    error_log("Fetching projects for user ID: " . $userId);
    
    // Fetch projects created by the user or where the user is a member
    $stmt = $conn->prepare("
        SELECT DISTINCT p.project_id, p.project_name, p.description, p.created_at
        FROM projects p
        LEFT JOIN project_members pm ON p.project_id = pm.project_id
        WHERE p.user_id = ? OR pm.user_id = ?
        ORDER BY p.created_at DESC
    ");
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $stmt->bind_param("ii", $userId, $userId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute statement: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception("Failed to get result: " . $stmt->error);
    }

    $projects = [];
    
    while ($row = $result->fetch_assoc()) {
        $projects[] = [
            'id' => $row['project_id'],
            'name' => $row['project_name'],
            'description' => $row['description'],
            'created_at' => $row['created_at']
        ];
    }
    
    $response = [
        'success' => true,
        'projects' => $projects
    ];

    error_log("Sending response: " . json_encode($response));
    echo json_encode($response);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("Error in get_user_projects.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching projects: ' . $e->getMessage()
    ]);
}
?> 