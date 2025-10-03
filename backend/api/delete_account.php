<?php
header('Access-Control-Allow-Origin: *');
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

if (!$data || !isset($data->user_id)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    $db->beginTransaction();
    // Delete from user_profile first (if not ON DELETE CASCADE)
    $stmt1 = $db->prepare("DELETE FROM user_profile WHERE user_id = :user_id");
    $stmt1->bindParam(':user_id', $data->user_id);
    $stmt1->execute();
    // Delete from user (should cascade to related tables if set)
    $stmt2 = $db->prepare("DELETE FROM user WHERE user_id = :user_id");
    $stmt2->bindParam(':user_id', $data->user_id);
    $stmt2->execute();
    $db->commit();
    echo json_encode([
        'status' => 'success',
        'message' => 'Account deleted successfully'
    ]);
} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
