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
    $checkTableQuery = "SHOW TABLES LIKE 'pickup_requests'";
    $checkStmt = $db->query($checkTableQuery);
    
    if ($checkStmt->rowCount() > 0) {
        echo json_encode(array(
            'status' => 'success',
            'message' => 'Table pickup_requests already exists'
        ));
        exit();
    }
    
    // Create the pickup_requests table
    $createTableQuery = "CREATE TABLE pickup_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requester_id INT NOT NULL,
        requester_name VARCHAR(255) NOT NULL,
        barangay VARCHAR(255) NOT NULL,
        contact_number VARCHAR(20) NOT NULL,
        pickup_date DATE NOT NULL,
        waste_type VARCHAR(100) NOT NULL,
        notes TEXT NULL,
        status ENUM('pending', 'scheduled', 'completed', 'declined') DEFAULT 'pending',
        scheduled_date DATE NULL,
        completed_date DATE NULL,
        declined_reason TEXT NULL,
        admin_remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        processed_by INT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        location_lat DECIMAL(10, 8) NULL,
        location_lng DECIMAL(11, 8) NULL,
        INDEX idx_requester_id (requester_id),
        INDEX idx_status (status),
        INDEX idx_pickup_date (pickup_date),
        INDEX idx_barangay (barangay),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $stmt = $db->prepare($createTableQuery);
    
    if ($stmt->execute()) {
        echo json_encode(array(
            'status' => 'success',
            'message' => 'Table pickup_requests created successfully'
        ));
    } else {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Failed to create table pickup_requests'
        ));
    }
    
} catch (PDOException $e) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
}
?>


