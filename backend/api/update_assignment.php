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
    if ($assignmentId <= 0) throw new Exception('Missing assignment_id');

    $fields = [];
    $params = [];

    // Allowed fields
    $map = [
        'date' => 'date',
        'time' => 'time',
        'driver_id' => 'driver_id',
        'truck_id' => 'truck_id',
        'status' => 'status',
    ];
    foreach ($map as $key => $col) {
        if (array_key_exists($key, $payload)) {
            $fields[] = "$col = ?";
            $params[] = $payload[$key];
        }
    }

    if (empty($fields)) throw new Exception('No fields to update');

    $database = new Database();
    $db = $database->connect();

    $sql = 'UPDATE task_assignments SET '.implode(', ', $fields).', updated_at = NOW() WHERE assignment_id = ?';
    $params[] = $assignmentId;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Assignment updated']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>









