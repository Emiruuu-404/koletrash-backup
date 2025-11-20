<?php
require_once __DIR__ . '/_bootstrap.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['user_id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "User ID is required."
    ]);
    exit();
}

$userId = $input['user_id'];

try {
    $conn = (new Database())->connect();
    $stmt = $conn->prepare("UPDATE user SET online_status = 'offline' WHERE user_id = ?");
    $stmt->execute([$userId]);

    if ($stmt->rowCount() === 0) {
        throw new Exception("User not found.");
    }

    echo json_encode([
        "success" => true,
        "message" => "User has been deactivated."
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>

