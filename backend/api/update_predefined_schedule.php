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
$database = new Database();
$db = $database->connect();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('Invalid JSON body');
    }

    // Accept several possible keys for the identifier to be robust
    $idKeys = ['schedule_template_id', 'template_id', 'id', 'schedule_id', 'predefined_id'];
    $id = 0;
    foreach ($idKeys as $k) {
        if (isset($input[$k]) && $input[$k] !== '') {
            $id = intval($input[$k]);
            break;
        }
    }
    if ($id <= 0) {
        throw new Exception('Missing schedule id');
    }

    $fields = [];
    $params = [];

    $allowed = ['day_of_week', 'start_time', 'end_time', 'week_of_month'];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $input)) {
            $fields[] = "$key = ?";
            $params[] = $input[$key];
        }
    }

    if (empty($fields)) {
        throw new Exception('No fields to update');
    }

    $params[] = $id;
    $sql = 'UPDATE predefined_schedules SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE schedule_template_id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Schedule updated']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


