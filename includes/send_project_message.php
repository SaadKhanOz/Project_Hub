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
$projectId = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if (!$projectId || $message === '') {
    echo json_encode(['success' => false, 'message' => 'Missing project ID or message']);
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

// The messages table does not have file_path, so we only insert project_id, user_id, message
$sql = "INSERT INTO messages (project_id, user_id, message) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}
$stmt->bind_param('iis', $projectId, $userId, $message);
if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message_id' => $stmt->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send message: ' . $stmt->error]);
} 