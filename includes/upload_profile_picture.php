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

if (!isset($_FILES['profile_picture'])) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['profile_picture'];
$userId = $_SESSION['user_id'];

// Validate file
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'File upload failed']);
    exit;
}

// Validate file size (5MB max)
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['status' => 'error', 'message' => 'File size must be less than 5MB']);
    exit;
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG and GIF are allowed']);
    exit;
}

// Create upload directory if it doesn't exist
$uploadDir = '../assets/uploads/profile_pictures/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'profile_' . $userId . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save file']);
    exit;
}

// Update database with new profile picture path
$relativePath = 'assets/uploads/profile_pictures/' . $filename;
$query = "UPDATE users SET profile_picture = ? WHERE user_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("si", $relativePath, $userId);

if ($stmt->execute()) {
    // Delete old profile picture if it exists
    $query = "SELECT profile_picture FROM users WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if ($user['profile_picture'] && $user['profile_picture'] !== $relativePath) {
        $oldFile = '../' . $user['profile_picture'];
        if (file_exists($oldFile)) {
            unlink($oldFile);
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Profile picture updated successfully',
        'file_path' => $relativePath
    ]);
} else {
    // Delete uploaded file if database update fails
    unlink($filepath);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update profile picture']);
}
?> 