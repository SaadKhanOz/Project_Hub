<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    // Get user data including profile picture
    require_once '../config/database.php';
    $query = "SELECT profile_picture FROM users WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    echo json_encode([
        'status' => 'success',
        'logged_in' => true,
        'user' => [
            'user_id' => $_SESSION['user_id'],
            'full_name' => $_SESSION['full_name'],
            'email' => $_SESSION['email'],
            'profile_picture' => $user['profile_picture']
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'success',
        'logged_in' => false
    ]);
}
?> 