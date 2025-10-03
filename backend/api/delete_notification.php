<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
$database = new Database();
$conn = $database->connect();
header('Content-Type: application/json');

$raw = file_get_contents("php://input");
if (empty($raw)) {
    echo json_encode(['success' => false, 'message' => 'Empty request body']);
    exit;
}
$data = json_decode($raw, true);
if ($data === null) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

if (!isset($data['notification_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing notification_id']);
    exit;
}

$notification_id = (int)$data['notification_id'];

try {
    $stmt = $conn->prepare('DELETE FROM notification WHERE notification_id = :id');
    $stmt->bindParam(':id', $notification_id, PDO::PARAM_INT);
    $ok = $stmt->execute();
    echo json_encode(['success' => $ok]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$stmt = null;
$conn = null;
?>


