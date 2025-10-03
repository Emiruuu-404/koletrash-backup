<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $assignmentId = isset($_GET['assignment_id']) ? intval($_GET['assignment_id']) : 0;
    if ($assignmentId <= 0) throw new Exception('Missing assignment_id');

    $database = new Database();
    $db = $database->connect();

    // Ensure table exists (in case log API wasn't called yet)
    $db->exec("CREATE TABLE IF NOT EXISTS task_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        user_id VARCHAR(50) NULL,
        event_type VARCHAR(64) NOT NULL,
        before_json JSON NULL,
        after_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_assignment (assignment_id),
        INDEX idx_event_type (event_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $db->prepare("SELECT id, assignment_id, user_id, event_type, before_json, after_json, created_at FROM task_events WHERE assignment_id = ? ORDER BY created_at DESC, id DESC");
    $stmt->execute([$assignmentId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'events' => $rows]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'events' => []]);
}
?>









