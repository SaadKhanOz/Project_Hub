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

try {
    // Update task
    $query = "UPDATE tasks SET 
              title = ?,
              description = ?,
              status = ?,
              priority = ?
              WHERE task_id = ?";
              
    $stmt = $conn->prepare($query);
    
    $stmt->bind_param("ssssi", 
        $data['title'],
        $data['description'],
        $data['status'],
        $data['priority'],
        $data['task_id']
    );
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0 || $stmt->errno === 0) {
            // Get updated task details
            $query = "SELECT * FROM tasks WHERE task_id = ?";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $data['task_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $task = $result->fetch_assoc();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task updated successfully',
                'task' => $task
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Task not found'
            ]);
        }
    } else {
        throw new Exception("Failed to update task");
    }

} catch (Exception $e) {
    error_log("Error in update_task.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to update task: ' . $e->getMessage()
    ]);
}
?> 