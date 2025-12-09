<?php
require_once '../config/database.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get invite ID from query string
$inviteId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$inviteId) {
    echo "<h2>Invalid invite link.</h2>";
    exit;
}

// Fetch invite details
$stmt = $conn->prepare("SELECT * FROM invites WHERE invite_id = ?");
$stmt->bind_param('i', $inviteId);
$stmt->execute();
$invite = $stmt->get_result()->fetch_assoc();

if (!$invite) {
    echo "<h2>Invite not found.</h2>";
    exit;
}

if ($invite['status'] === 'accepted') {
    echo "<h2>This invite has already been accepted.</h2>";
    exit;
}

$email = $invite['email'];
$projectId = $invite['project_id'];

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['full_name'] ?? '');
    $password = $_POST['password'] ?? '';
    $email = $invite['email']; // Always use invite email

    // Check if user already exists
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user) {
        // User exists, check password
        if (password_verify($password, $user['password'])) {
            $userId = $user['user_id'];
            session_start();
            $_SESSION['user_id'] = $userId;
            $_SESSION['email'] = $user['email'];
            $_SESSION['full_name'] = $user['full_name'];
        } else {
            echo "<h2>Incorrect password for existing user. <a href='../login.html'>Login here</a></h2>";
            exit;
        }
    } else {
        // Register new user
        if (!$fullName || !$password) {
            echo "<h2>Full name and password are required.</h2>";
            exit;
        }
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param('sss', $fullName, $email, $hashedPassword);
        if (!$stmt->execute()) {
            echo "<h2>Failed to register user.</h2>";
            exit;
        }
        $userId = $conn->insert_id;
        session_start();
        $_SESSION['user_id'] = $userId;
        $_SESSION['email'] = $email;
        $_SESSION['full_name'] = $fullName;
    }

    // Add user to project_members if not already
    $stmt = $conn->prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ?");
    $stmt->bind_param('ii', $projectId, $userId);
    $stmt->execute();
    $isMember = $stmt->get_result()->fetch_assoc();
    if (!$isMember) {
        $stmt = $conn->prepare("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)");
        $stmt->bind_param('ii', $projectId, $userId);
        $stmt->execute();
    }

    // Update invite status to accepted
    $stmt = $conn->prepare("UPDATE invites SET status = 'accepted' WHERE invite_id = ?");
    $stmt->bind_param('i', $inviteId);
    $stmt->execute();

    // Redirect to home.html
    header("Location: ../home.html");
    exit;
}

// Check if user already exists
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if ($user) {
    // Show login form for existing user
    echo <<<HTML
    <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background-color: #f4f5f7;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    ">
        <div style="
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        ">
            <h2 style="
                color: #172b4d;
                margin-top: 0;
                margin-bottom: 24px;
                font-size: 24px;
                font-weight: 500;
            ">Welcome back!</h2>
            <p style="color: #42526e; margin-bottom: 24px;">Please enter your password to accept the invitation.</p>
            <form method="POST">
                <input type="hidden" name="full_name" value="{$user['full_name']}">
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #42526e;
                        font-size: 14px;
                        font-weight: 500;
                    ">Email</label>
                    <input type="email" name="email" value="{$email}" readonly style="
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid #dfe1e6;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #172b4d;
                        background-color: #f4f5f7;
                        cursor: not-allowed;
                    ">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #42526e;
                        font-size: 14px;
                        font-weight: 500;
                    ">Password</label>
                    <input type="password" name="password" required placeholder="Enter your password" style="
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid #dfe1e6;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #172b4d;
                    ">
                </div>
                <button type="submit" style="
                    background-color: #0052cc;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                ">Accept Invitation</button>
            </form>
            <a href="../login.html" style="
                display: block;
                text-align: center;
                margin-top: 16px;
                color: #42526e;
                text-decoration: none;
                font-size: 14px;
            ">Back to Login</a>
        </div>
    </div>
    HTML;
} else {
    // Show registration form for new user
    echo <<<HTML
    <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background-color: #f4f5f7;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    ">
        <div style="
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        ">
            <h2 style="
                color: #172b4d;
                margin-top: 0;
                margin-bottom: 24px;
                font-size: 24px;
                font-weight: 500;
            ">Create Your Account</h2>
            <p style="color: #42526e; margin-bottom: 24px;">Complete your registration to accept the invitation.</p>
            <form method="POST">
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #42526e;
                        font-size: 14px;
                        font-weight: 500;
                    ">Full Name</label>
                    <input type="text" name="full_name" required placeholder="Enter your full name" style="
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid #dfe1e6;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #172b4d;
                    ">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #42526e;
                        font-size: 14px;
                        font-weight: 500;
                    ">Email</label>
                    <input type="email" name="email" value="{$email}" readonly style="
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid #dfe1e6;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #172b4d;
                        background-color: #f4f5f7;
                        cursor: not-allowed;
                    ">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #42526e;
                        font-size: 14px;
                        font-weight: 500;
                    ">Password</label>
                    <input type="password" name="password" required placeholder="Create a password" style="
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid #dfe1e6;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #172b4d;
                    ">
                    <div style="margin-top: 8px; font-size: 12px; color: #5e6c84;">
                        Password must be at least 8 characters long
                    </div>
                </div>
                <button type="submit" style="
                    background-color: #0052cc;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                ">Register & Accept Invitation</button>
            </form>
        </div>
    </div>
    HTML;
}
