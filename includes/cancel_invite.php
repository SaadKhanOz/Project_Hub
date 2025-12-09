<?php
session_start();
require_once 'db_config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$inviteId = $data['invite_id'] ?? '';

if (empty($inviteId)) {
    echo json_encode(['status' => 'error', 'message' => 'Invite ID is required']);
    exit;
}

try {
    // First check if the user has permission to cancel this invite
    $stmt = $conn->prepare("SELECT i.* FROM invites i 
                           JOIN projects p ON i.project_id = p.project_id 
                           WHERE i.invite_id = ? AND (i.invited_by = ? OR p.user_id = ?)");
    $stmt->bind_param('iii', $inviteId, $_SESSION['user_id'], $_SESSION['user_id']);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Permission denied']);
        exit;
    }

    // Delete the invite
    $stmt = $conn->prepare("DELETE FROM invites WHERE invite_id = ?");
    $stmt->bind_param('i', $inviteId);
    $stmt->execute();

    echo json_encode(['status' => 'success', 'message' => 'Invitation cancelled successfully']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} 