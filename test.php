<?php
// Display PHP information
echo "<h2>PHP Information:</h2>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br><br>";

// Test database connection
echo "<h2>Database Connection Test:</h2>";
try {
    $host = 'localhost';
    $dbname = 'project_hub';
    $username = 'root';
    $password = '';

    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Database connection successful!<br>";
    
    // Test if tables exist
    $tables = ['users', 'projects', 'invites', 'project_members', 'tasks', 'task_assignees', 'messages'];
    echo "<br>Checking database tables:<br>";
    foreach ($tables as $table) {
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists<br>";
        } else {
            echo "❌ Table '$table' does not exist<br>";
        }
    }
} catch(PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
}

// Test file permissions
echo "<br><h2>File System Test:</h2>";
$testDir = __DIR__;
echo "Current directory: $testDir<br>";
echo "Directory writable: " . (is_writable($testDir) ? "✅ Yes" : "❌ No") . "<br>";

// Test if we can create a file
$testFile = $testDir . '/test_write.txt';
if (file_put_contents($testFile, 'Test write access')) {
    echo "✅ File write test successful<br>";
    unlink($testFile); // Clean up test file
} else {
    echo "❌ File write test failed<br>";
}

// Display server environment
echo "<br><h2>Server Environment:</h2>";
echo "Operating System: " . PHP_OS . "<br>";
echo "Server Name: " . $_SERVER['SERVER_NAME'] . "<br>";
echo "Server Protocol: " . $_SERVER['SERVER_PROTOCOL'] . "<br>";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "<br>";
?> 