<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['task_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Task ID is required']);
    exit;
}

$taskId = intval($data['task_id']);

try {
    // Delete task
    $query = "DELETE FROM tasks WHERE task_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $taskId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Task deleted successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Task not found'
            ]);
        }
    } else {
        throw new Exception("Failed to delete task");
    }

} catch (Exception $e) {
    error_log("Error in delete_task.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to delete task'
    ]);
}
?> 