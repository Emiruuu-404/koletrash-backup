<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/Database.php';

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

// Check if users table exists and get admin user
try {
    $query = "SELECT id, username, email, fullName, role FROM users WHERE username = 'admin' LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => 'success',
            'message' => 'Admin user found',
            'user' => $user,
            'total_users' => 'checking...'
        ]);
    } else {
        // Check total users
        $countQuery = "SELECT COUNT(*) as total FROM users";
        $countStmt = $db->prepare($countQuery);
        $countStmt->execute();
        $count = $countStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'error',
            'message' => 'Admin user not found',
            'total_users' => $count['total'],
            'suggestion' => 'Need to create admin user'
        ]);
    }
} catch(PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
