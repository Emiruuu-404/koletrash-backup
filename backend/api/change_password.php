<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/Database.php';

$database = new Database();
$db = $database->connect();

$json_input = file_get_contents("php://input");
$data = json_decode($json_input);

if (!$data || !isset($data->id) || !isset($data->currentPassword) || !isset($data->newPassword)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'All password fields are required'
    ]);
    exit();
}

try {
    // First, verify current password
    $verifyQuery = "SELECT password FROM user WHERE user_id = :id";
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->bindParam(':id', $data->id);
    $verifyStmt->execute();
    
    if ($verifyStmt->rowCount() === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found'
        ]);
        exit();
    }
    
    $user = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!password_verify($data->currentPassword, $user['password'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Current password is incorrect'
        ]);
        exit();
    }
    
    // Hash new password and update
    $hashedPassword = password_hash($data->newPassword, PASSWORD_DEFAULT);
    $updateQuery = "UPDATE user SET password = :password WHERE user_id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password', $hashedPassword);
    $updateStmt->bindParam(':id', $data->id);
    
    if ($updateStmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Password changed successfully'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update password'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
