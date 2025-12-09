<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$taskId = (int)($_GET['task_id'] ?? 0);
if (!$taskId) {
    echo json_encode(['success' => false, 'message' => 'No task ID']);
    exit;
}

$stmt = $conn->prepare("SELECT u.user_id, u.full_name, u.email FROM task_assignees ta JOIN users u ON ta.user_id = u.user_id WHERE ta.task_id = ?");
$stmt->bind_param('i', $taskId);
$stmt->execute();
$result = $stmt->get_result();
$assignees = [];
while ($row = $result->fetch_assoc()) {
    $assignees[] = $row;
}
echo json_encode(['success' => true, 'assignees' => $assignees]); 