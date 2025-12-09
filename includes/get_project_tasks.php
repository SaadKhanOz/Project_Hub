<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];
$projectId = (int)($_GET['project_id'] ?? 0);

if (!$projectId) {
    echo json_encode(['success' => false, 'message' => 'No project ID']);
    exit;
}

// Check if user is the creator
$stmt = $conn->prepare("SELECT user_id FROM projects WHERE project_id = ?");
$stmt->bind_param('i', $projectId);
$stmt->execute();
$project = $stmt->get_result()->fetch_assoc();
$isCreator = $project && $project['user_id'] == $userId;

if ($isCreator) {
    // Creator: get all tasks for the project
    $stmt = $conn->prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC");
    $stmt->bind_param('i', $projectId);
} else {
    // Team member: get only tasks assigned to this user
    $stmt = $conn->prepare("
        SELECT t.* FROM tasks t
        JOIN task_assignees ta ON t.task_id = ta.task_id
        WHERE t.project_id = ? AND ta.user_id = ?
        ORDER BY t.created_at DESC
    ");
    $stmt->bind_param('ii', $projectId, $userId);
}

$stmt->execute();
$result = $stmt->get_result();
$tasks = [];
while ($row = $result->fetch_assoc()) {
    $tasks[] = $row;
}
echo json_encode(['success' => true, 'tasks' => $tasks]);
?> 