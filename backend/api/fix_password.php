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

// Update admin password to "admin123"
try {
    $new_password = 'admin123';
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    $query = "UPDATE users SET password = :password WHERE username = 'admin'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':password', $hashed_password);
    
    if($stmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Admin password updated successfully',
            'username' => 'admin',
            'password' => 'admin123',
            'note' => 'You can now login with these credentials'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update password'
        ]);
    }
} catch(PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
