<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if database.php exists in the config directory
if (!file_exists(__DIR__ . '/../config/database.php')) {
    error_log('database.php not found in: ' . __DIR__ . '/../config/');
    echo json_encode([
        'success' => false,
        'message' => 'Database configuration not found'
    ]);
    exit;
}

require_once '../config/database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

try {
    // Check database connection
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? 'Connection not established'));
    }

    $userId = $_SESSION['user_id'];
    error_log("Fetching profile for user ID: " . $userId);
    
    // Prepare and execute query to get user's profile
    $stmt = $conn->prepare("SELECT full_name, email, profile_picture FROM users WHERE user_id = ?");
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $stmt->bind_param("i", $userId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute statement: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception("Failed to get result: " . $stmt->error);
    }

    $user = $result->fetch_assoc();
    if (!$user) {
        throw new Exception("User not found for ID: " . $userId);
    }
    
    // Get profile picture path
    $profilePicture = $user['profile_picture'];
    if (empty($profilePicture)) {
        $profilePicture = 'uploads/profile_pictures/default.png';
    } else if (!str_starts_with($profilePicture, 'http')) {
        // If it's not an external URL, make sure the path is relative to root
        $profilePicture = ltrim($profilePicture, '/');
    }
    
    $response = [
        'success' => true,
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'profile_picture' => $profilePicture
    ];
    
    error_log("Sending response: " . json_encode($response));
    echo json_encode($response);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("Error in get_user_profile.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching user profile: ' . $e->getMessage()
    ]);
}
?> 