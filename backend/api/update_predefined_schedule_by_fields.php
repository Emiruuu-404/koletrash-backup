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

    // Natural keys to find a predefined schedule when id is unavailable
    // We allow sending separate match_* fields (original values) when editing times/days
    $required = ['barangay_id', 'schedule_type'];
    foreach ($required as $r) {
        if (!isset($input[$r]) || $input[$r] === '') {
            throw new Exception('Missing field: ' . $r);
        }
    }

    $barangayId = $input['barangay_id'];
    $scheduleType = $input['schedule_type'];
    $dayOfWeek = isset($input['match_day_of_week']) ? $input['match_day_of_week'] : (isset($input['day_of_week']) ? $input['day_of_week'] : null);
    $startTime = isset($input['match_start_time']) ? $input['match_start_time'] : (isset($input['start_time']) ? $input['start_time'] : null);
    if ($dayOfWeek === null || $startTime === null) {
        throw new Exception('Missing day_of_week or start_time for matching');
    }
    $clusterId = isset($input['cluster_id']) ? $input['cluster_id'] : null;
    $weekOfMonthFilter = isset($input['week_of_month']) ? intval($input['week_of_month']) : null;

    // Build WHERE clause
    // Normalize HH:MM vs HH:MM:SS by comparing TIME()
    $where = 'WHERE barangay_id = ? AND schedule_type = ? AND day_of_week = ? AND TIME(start_time) = TIME(?)';
    $params = [$barangayId, $scheduleType, $dayOfWeek, $startTime];

    if ($clusterId !== null && $clusterId !== '') {
        $where .= ' AND cluster_id = ?';
        $params[] = $clusterId;
    }
    if ($weekOfMonthFilter !== null) {
        $where .= ' AND (week_of_month = ? OR week_of_month IS NULL)';
        $params[] = $weekOfMonthFilter;
    }

    // Determine fields to update
    $setParts = [];
    $setParams = [];
    $allowed = ['day_of_week', 'start_time', 'end_time', 'week_of_month'];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $input)) {
            $setParts[] = "$key = ?";
            $setParams[] = $input[$key];
        }
    }
    if (empty($setParts)) {
        throw new Exception('No fields to update');
    }

    $sql = 'UPDATE predefined_schedules SET ' . implode(', ', $setParts) . ', updated_at = NOW() ' . $where . ' LIMIT 1';
    $stmt = $db->prepare($sql);
    $stmt->execute(array_merge($setParams, $params));

    if ($stmt->rowCount() < 1) {
        echo json_encode(['success' => false, 'message' => 'No matching schedule found to update']);
        exit();
    }

    echo json_encode(['success' => true, 'message' => 'Schedule updated by fields']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


