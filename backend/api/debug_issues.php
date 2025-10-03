<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->connect();
    
    // Check if the table exists
    $tableCheckQuery = "SHOW TABLES LIKE 'issue_reports'";
    $result = $db->query($tableCheckQuery);
    $tableExists = $result->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'status' => 'error',
            'message' => 'issue_reports table does not exist'
        ]);
        exit;
    }
    
    // Get all issues for debugging
    $query = "SELECT * FROM issue_reports LIMIT 5";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $issues = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful',
        'table_exists' => $tableExists,
        'sample_issues' => $issues
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
