<?php
require_once '../config/database.php';
session_start();

header('Content-Type: application/json');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (isset($_SESSION['user_id'])) {
    // Store user_id before clearing session
    $user_id = $_SESSION['user_id'];
    
    // Update online status to false
    $update = "UPDATE users SET is_online = 0 WHERE user_id = ?";
    $stmt = $conn->prepare($update);
    
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Database prepare failed']);
        exit;
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        echo json_encode(['status' => 'error', 'message' => 'Failed to update online status']);
        exit;
    }
    
    // Verify the update
    $verify = "SELECT is_online FROM users WHERE user_id = ?";
    $verify_stmt = $conn->prepare($verify);
    $verify_stmt->bind_param("i", $user_id);
    $verify_stmt->execute();
    $result = $verify_stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['is_online'] != 0) {
        error_log("Update verification failed for user_id: $user_id");
        echo json_encode(['status' => 'error', 'message' => 'Failed to verify online status update']);
        exit;
    }
    
    // Clear all session variables
    $_SESSION = array();
    
    // Destroy the session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time()-3600, '/');
    }
    
    // Destroy the session
    session_destroy();
    
    // Redirect to login page
    header("Location: ../login.html");
    exit();
} else {
    echo json_encode(['status' => 'error', 'message' => 'No active session found']);
}
?> 