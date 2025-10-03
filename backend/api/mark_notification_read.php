<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Debug: log raw input and decoded data
$raw = file_get_contents("php://input");
if (empty($raw)) {
    echo json_encode(['success' => false, 'message' => 'Empty request body']);
    exit;
}
file_put_contents(__DIR__ . '/debug_mark_read.txt', "RAW INPUT:\n" . $raw . "\n", FILE_APPEND);
$data = json_decode($raw, true);
if ($data === null) {
    file_put_contents(__DIR__ . '/debug_mark_read.txt', "JSON decode error: " . json_last_error_msg() . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}
file_put_contents(__DIR__ . '/debug_mark_read.txt', "DECODED DATA:\n" . print_r($data, true) . "\n", FILE_APPEND);

require_once '../config/database.php';
$database = new Database();
$conn = $database->connect();
header('Content-Type: application/json');

if (!isset($data['notification_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing notification_id']);
    exit;
}

$notification_id = $data['notification_id'];
$sql = "UPDATE notification SET response_status = 'read' WHERE notification_id = :notification_id";
$stmt = $conn->prepare($sql);
$stmt->bindParam(':notification_id', $notification_id, PDO::PARAM_INT);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update notification']);
}
$stmt = null;
$conn = null;
?>
