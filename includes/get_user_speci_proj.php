<?php
session_start();
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];

$sql = "SELECT p.project_id, p.project_name
        FROM projects p
        INNER JOIN project_members pm ON p.project_id = pm.project_id
        WHERE pm.user_id = ?
        ORDER BY p.project_name ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();

$projects = [];
while ($row = $result->fetch_assoc()) {
    $projects[] = $row;
}

echo json_encode(['success' => true, 'projects' => $projects]); 