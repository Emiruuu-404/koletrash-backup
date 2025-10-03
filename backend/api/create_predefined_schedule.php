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

    $required = ['barangay_id', 'barangay_name', 'cluster_id', 'schedule_type', 'day_of_week', 'start_time', 'end_time'];
    foreach ($required as $r) {
        if (empty($input[$r])) {
            throw new Exception('Missing field: ' . $r);
        }
    }

    $weekOfMonth = isset($input['week_of_month']) ? intval($input['week_of_month']) : null;
    $frequencyPerDay = isset($input['frequency_per_day']) ? intval($input['frequency_per_day']) : 1;
    $isActive = isset($input['is_active']) ? intval($input['is_active']) : 1;

    $sql = 'INSERT INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $input['barangay_id'],
        $input['barangay_name'],
        $input['cluster_id'],
        $input['schedule_type'],
        $input['day_of_week'],
        $input['start_time'],
        $input['end_time'],
        $frequencyPerDay,
        $weekOfMonth,
        $isActive
    ]);

    echo json_encode(['success' => true, 'message' => 'Schedule created', 'schedule_template_id' => $db->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>









