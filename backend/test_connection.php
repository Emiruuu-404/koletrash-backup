<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once 'config/Database.php';

try {
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Database connection successful',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
