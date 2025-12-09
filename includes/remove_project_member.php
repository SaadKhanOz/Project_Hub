<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$projectId = (int)($data['project_id'] ?? 0);
$userIdToRemove = (int)($data['user_id'] ?? 0);
$currentUserId = $_SESSION['user_id'];

// Only the creator can remove members
$stmt = $conn->prepare("SELECT user_id FROM projects WHERE project_id = ?");
$stmt->bind_param('i', $projectId);
$stmt->execute();
$project = $stmt->get_result()->fetch_assoc();

if (!$project || $project['user_id'] != $currentUserId) {
    echo json_encode(['success' => false, 'message' => 'Not authorized']);
    exit;
}

// Remove member
$stmt = $conn->prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?");
$stmt->bind_param('ii', $projectId, $userIdToRemove);
$stmt->execute();

echo json_encode(['success' => true]); 