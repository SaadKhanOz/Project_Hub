<?php
session_start();
require_once '../config/database.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

// Get POST data
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$projectId = isset($_POST['project_id']) ? (int)$_POST['project_id'] : 0;

// Validate input
if (empty($email) || empty($projectId)) {
    echo json_encode(['status' => 'error', 'message' => 'Email and project ID are required']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
    exit;
}

try {
    // Check database connection
    if (!isset($conn)) {
        throw new Exception("Database connection not established");
    }

    // Check if user has access to the project
    $access_check = $conn->prepare("
        SELECT COUNT(*) as access_count
        FROM projects p 
        LEFT JOIN project_members pm ON p.project_id = pm.project_id 
        WHERE p.project_id = ? AND (p.user_id = ? OR pm.user_id = ?)
    ");
    
    if (!$access_check) {
        throw new Exception("Access check prepare failed: " . $conn->error);
    }
    
    $access_check->bind_param('iii', $projectId, $_SESSION['user_id'], $_SESSION['user_id']);
    $access_check->execute();
    $access_result = $access_check->get_result();
    $access_row = $access_result->fetch_assoc();
    
    if ($access_row['access_count'] == 0) {
        echo json_encode(['status' => 'error', 'message' => 'Access denied']);
        exit;
    }

    // Check if invite already exists
    $check_invite = $conn->prepare("
        SELECT invite_id, status 
        FROM invites 
        WHERE project_id = ? AND email = ? AND status = 'pending'
    ");
    
    $check_invite->bind_param('is', $projectId, $email);
    $check_invite->execute();
    $result = $check_invite->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invite already sent to this email']);
        exit;
    }

    // Insert new invite
    $insert_invite = $conn->prepare("
        INSERT INTO invites (project_id, email, invited_by, status) 
        VALUES (?, ?, ?, 'pending')
    ");
    
    if (!$insert_invite) {
        throw new Exception("Insert prepare failed: " . $conn->error);
    }
    
    $insert_invite->bind_param('isi', $projectId, $email, $_SESSION['user_id']);
    
    if (!$insert_invite->execute()) {
        throw new Exception("Failed to send invite: " . $insert_invite->error);
    }

    // --- DEBUG: Log and fix inviteId ---
    $inviteId = $conn->insert_id;
    error_log('Invite ID after insert: ' . $inviteId);
    if (!$inviteId || $inviteId == 0) {
        // Try to fetch again
        $inviteId = mysqli_insert_id($conn);
        error_log('Invite ID after mysqli_insert_id: ' . $inviteId);
    }
    if (!$inviteId || $inviteId == 0) {
        error_log('ERROR: Invite ID is still 0 after insert!');
        throw new Exception('Failed to get invite ID after insert.');
    }
    // --- END DEBUG ---

    // --- SEND EMAIL INVITE ---
    require_once '../vendor/autoload.php';
    $mailConfig = require '../config/mail_config.php';

    // Get project name for the email
    $stmt = $conn->prepare("SELECT project_name FROM projects WHERE project_id = ?");
    $stmt->bind_param('i', $projectId);
    $stmt->execute();
    $projectResult = $stmt->get_result();
    $project = $projectResult->fetch_assoc();

    // Use correct project subdirectory in invite link
    $inviteLink = "http://" . $_SERVER['HTTP_HOST'] . "/Project-Hub123/includes/accept_invite.php?id=" . $inviteId;

    $emailContent = "<h2>You've been invited to join " . htmlspecialchars($project['project_name']) . "</h2>"
        . "<p>Click the link below to accept the invitation:</p>"
        . "<p><a href='" . $inviteLink . "'>Accept Invitation</a></p>"
        . "<p>If you didn't expect this invitation, you can ignore this email.</p>";

    $sendgrid = new \SendGrid($mailConfig['api_key']);
    $sgMail = new \SendGrid\Mail\Mail();
    $sgMail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
    $sgMail->setSubject("Invitation to join " . $project['project_name']);
    $sgMail->addTo($email);
    $sgMail->addContent("text/html", $emailContent);

    try {
        $response = $sendgrid->send($sgMail);
        if ($response->statusCode() < 200 || $response->statusCode() >= 300) {
            // Delete invite if email fails
            $conn->query("DELETE FROM invites WHERE invite_id = $inviteId");
            throw new Exception('Failed to send email');
        }
    } catch (Exception $e) {
        $conn->query("DELETE FROM invites WHERE invite_id = $inviteId");
        echo json_encode(['status' => 'error', 'message' => 'Failed to send email: ' . $e->getMessage()]);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Invite sent successfully and email delivered.'
    ]);

} catch (Exception $e) {
    error_log("Error in send_invite.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send invite: ' . $e->getMessage()
    ]);
} 