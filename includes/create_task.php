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

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
    exit;
}

// Validate required fields
if (empty($data['project_id']) || empty($data['title'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

try {
    // Start transaction
    $conn->begin_transaction();

    // Insert task
    $query = "INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    
    $projectId = $data['project_id'];
    $title = $data['title'];
    $description = $data['description'] ?? '';
    $status = $data['status'] ?? 'To Do';
    $priority = $data['priority'] ?? 'Medium';
    $dueDate = $data['due_date'] ?? null;

    $stmt->bind_param("isssss", $projectId, $title, $description, $status, $priority, $dueDate);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create task");
    }

    $taskId = $stmt->insert_id;

    // If assignee is specified, add to task_assignees
    if (!empty($data['assignees'])) {
        $query = "INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        foreach ($data['assignees'] as $userId) {
            $stmt->bind_param("ii", $taskId, $userId);
            $stmt->execute();
        }
    }

    // Commit transaction
    $conn->commit();

    // Return success response with task ID
    echo json_encode([
        'status' => 'success',
        'message' => 'Task created successfully',
        'task_id' => $taskId
    ]);

} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 