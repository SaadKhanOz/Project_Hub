<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['full_name']) || !isset($data['current_password'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$userId = $_SESSION['user_id'];
$fullName = $data['full_name'];
$currentPassword = $data['current_password'];
$newPassword = $data['new_password'] ?? null;

// Verify current password
$query = "SELECT password FROM users WHERE user_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!password_verify($currentPassword, $user['password'])) {
    echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect']);
    exit;
}

// Update user information
if ($newPassword) {
    // Update name and password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $query = "UPDATE users SET full_name = ?, password = ? WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssi", $fullName, $hashedPassword, $userId);
} else {
    // Update name only
    $query = "UPDATE users SET full_name = ? WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $fullName, $userId);
}

if ($stmt->execute()) {
    // Update session
    $_SESSION['full_name'] = $fullName;
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully',
        'user' => [
            'full_name' => $fullName
        ]
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update profile']);
}
?> 