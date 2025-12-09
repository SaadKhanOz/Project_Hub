<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$projectId = (int)($_GET['project_id'] ?? 0);
$userId = $_SESSION['user_id'];

// Check if current user is the creator
$stmt = $conn->prepare("SELECT user_id FROM projects WHERE project_id = ?");
$stmt->bind_param('i', $projectId);
$stmt->execute();
$project = $stmt->get_result()->fetch_assoc();
$isCreator = $project && $project['user_id'] == $userId;

// Get all members
$stmt = $conn->prepare("
    SELECT u.user_id, u.full_name, u.email
    FROM project_members pm
    JOIN users u ON pm.user_id = u.user_id
    WHERE pm.project_id = ?
");
$stmt->bind_param('i', $projectId);
$stmt->execute();
$result = $stmt->get_result();

$members = [];
while ($row = $result->fetch_assoc()) {
    $members[] = $row;
}

echo json_encode([
    'success' => true,
    'members' => $members,
    'is_creator' => $isCreator,
    'current_user_id' => $userId
]); 