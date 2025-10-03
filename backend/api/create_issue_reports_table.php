<?php
// Headers - Allow all origins for development
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Method not allowed'
    ));
    exit();
}

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

try {
    // Check if table exists
    $checkTableQuery = "SHOW TABLES LIKE 'issue_reports'";
    $checkStmt = $db->query($checkTableQuery);
    
    if ($checkStmt->rowCount() > 0) {
        echo json_encode(array(
            'status' => 'success',
            'message' => 'Table issue_reports already exists'
        ));
        exit();
    }
    
    // Create the issue_reports table
    $createTableQuery = "CREATE TABLE issue_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        reporter_name VARCHAR(255) NOT NULL,
        barangay VARCHAR(255),
        issue_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        photo_url VARCHAR(500),
        status ENUM('pending', 'active', 'resolved', 'closed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        resolved_by INT NULL,
        resolution_notes TEXT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        location_lat DECIMAL(10, 8) NULL,
        location_lng DECIMAL(11, 8) NULL,
        INDEX idx_reporter_id (reporter_id),
        INDEX idx_status (status),
        INDEX idx_issue_type (issue_type),
        INDEX idx_created_at (created_at),
        INDEX idx_barangay (barangay)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $stmt = $db->prepare($createTableQuery);
    
    if ($stmt->execute()) {
        echo json_encode(array(
            'status' => 'success',
            'message' => 'Table issue_reports created successfully'
        ));
    } else {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Failed to create table issue_reports'
        ));
    }
    
} catch (PDOException $e) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
}
?>


