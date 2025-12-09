<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : (isset($_POST['project_id']) ? intval($_POST['project_id']) : 0);

if (!$projectId) {
    echo json_encode(['success' => false, 'message' => 'No project ID provided']);
    exit;
}

// Check if user is a member of the project
$check = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?");
$check->bind_param('ii', $projectId, $userId);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Get messages with sender info (no file_path column)
$sql = "SELECT m.message_id, m.message, m.sent_at, u.user_id, u.full_name, u.email, u.profile_picture
        FROM messages m
        INNER JOIN users u ON m.user_id = u.user_id
        WHERE m.project_id = ?
        ORDER BY m.sent_at ASC";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}
$stmt->bind_param('i', $projectId);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}

echo json_encode(['success' => true, 'messages' => $messages]);
