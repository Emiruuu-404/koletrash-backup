<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload) throw new Exception('Invalid JSON');

    $assignmentId = isset($payload['assignment_id']) ? intval($payload['assignment_id']) : 0;
    $eventType = isset($payload['event_type']) ? trim($payload['event_type']) : '';
    $before = isset($payload['before']) ? json_encode($payload['before']) : null;
    $after = isset($payload['after']) ? json_encode($payload['after']) : null;
    $userId = isset($payload['user_id']) ? $payload['user_id'] : null; // optional

    if ($assignmentId <= 0 || $eventType === '') {
        throw new Exception('Missing assignment_id or event_type');
    }

    $database = new Database();
    $db = $database->connect();

    // Ensure table exists
    $db->exec("CREATE TABLE IF NOT EXISTS task_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        user_id VARCHAR(50) NULL,
        event_type VARCHAR(64) NOT NULL,
        before_json JSON NULL,
        after_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_assignment (assignment_id),
        INDEX idx_event_type (event_type),
        FOREIGN KEY (assignment_id) REFERENCES task_assignments(assignment_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $db->prepare("INSERT INTO task_events (assignment_id, user_id, event_type, before_json, after_json) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$assignmentId, $userId, $eventType, $before, $after]);

    echo json_encode(['success' => true, 'message' => 'Event logged']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>









