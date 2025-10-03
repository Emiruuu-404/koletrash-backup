<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

$recipient_id = isset($_GET['recipient_id']) ? intval($_GET['recipient_id']) : null;

if (!$recipient_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing recipient_id.'
    ]);
    exit();
}

try {
    $database = new Database();
    $pdo = $database->connect();

    if (!$pdo) {
        throw new Exception('Database connection failed.');
    }

    $query = "SELECT notification_id, message, created_at, response_status 
              FROM notification 
              WHERE recipient_id = :recipient_id 
              ORDER BY created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':recipient_id', $recipient_id, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 
