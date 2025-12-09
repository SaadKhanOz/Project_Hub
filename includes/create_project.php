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

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
    exit;
}

try {
    // Check database connection
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? 'Connection not established'));
    }

    // Get and validate the form data
    $projectName = trim($_POST['name'] ?? '');
    $projectDescription = trim($_POST['key'] ?? ''); // Using key field for description
    $userId = $_SESSION['user_id'];

    error_log("Received project data - Name: $projectName, Description: $projectDescription, User ID: $userId");

    // Validate input
    if (empty($projectName)) {
        throw new Exception('Project name is required');
    }

    // Prepare the SQL statement
    $stmt = $conn->prepare("INSERT INTO projects (user_id, project_name, description, created_at) VALUES (?, ?, ?, NOW())");
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $stmt->bind_param("iss", $userId, $projectName, $projectDescription);

    // Execute the statement
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute statement: " . $stmt->error);
    }

    $projectId = $stmt->insert_id;
    
    $response = [
        'success' => true,
        'message' => 'Project created successfully',
        'project_id' => $projectId
    ];

    error_log("Project created successfully with ID: " . $projectId);
    echo json_encode($response);

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    error_log("Error in create_project.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error creating project: ' . $e->getMessage()
    ]);
}
?> 