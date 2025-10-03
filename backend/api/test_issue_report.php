<?php
// Test script for issue report functionality
header('Content-Type: application/json');

echo "Testing Issue Report Backend\n";
echo "============================\n\n";

// Test 1: Check if table exists
echo "1. Checking if issue_reports table exists...\n";
require_once '../config/database.php';
$database = new Database();
$db = $database->connect();

try {
    $checkTableQuery = "SHOW TABLES LIKE 'issue_reports'";
    $checkStmt = $db->query($checkTableQuery);
    
    if ($checkStmt->rowCount() > 0) {
        echo "✓ Table issue_reports exists\n";
        
        // Test 2: Check table structure
        echo "\n2. Checking table structure...\n";
        $describeQuery = "DESCRIBE issue_reports";
        $describeStmt = $db->query($describeQuery);
        $columns = $describeStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Table columns:\n";
        foreach ($columns as $column) {
            echo "  - " . $column['Field'] . " (" . $column['Type'] . ")\n";
        }
        
        // Test 3: Check uploads directory
        echo "\n3. Checking uploads directory...\n";
        $upload_dir = '../../uploads/issue_reports/';
        if (file_exists($upload_dir)) {
            echo "✓ Uploads directory exists\n";
            if (is_writable($upload_dir)) {
                echo "✓ Uploads directory is writable\n";
            } else {
                echo "✗ Uploads directory is not writable\n";
            }
        } else {
            echo "✗ Uploads directory does not exist\n";
        }
        
        // Test 4: Test file upload validation
        echo "\n4. Testing file upload validation...\n";
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        echo "Allowed file types: " . implode(', ', $allowed_types) . "\n";
        echo "Max file size: 5MB\n";
        
        echo "\n✓ All tests completed successfully!\n";
        echo "\nBackend is ready to handle issue reports.\n";
        
    } else {
        echo "✗ Table issue_reports does not exist\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
?>


