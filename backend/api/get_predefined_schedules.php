<?php
require_once __DIR__ . '/_bootstrap.php';
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
    $database = new Database();
    $db = $database->connect();
    
    // Optional filters from query string
    $scheduleType = isset($_GET['schedule_type']) ? $_GET['schedule_type'] : null;
    $clusterId = isset($_GET['cluster_id']) ? $_GET['cluster_id'] : null;
    $weekOfMonth = isset($_GET['week_of_month']) ? intval($_GET['week_of_month']) : null;
    $daysCsv = isset($_GET['days']) ? $_GET['days'] : null; // e.g., Monday,Tuesday
    $days = [];
    if ($daysCsv) {
        foreach (explode(',', $daysCsv) as $d) {
            $d = trim($d);
            if ($d !== '') { $days[] = $d; }
        }
    }

    $sql = "
        SELECT 
            ps.schedule_template_id,
            ps.barangay_id,
            ps.barangay_name,
            ps.cluster_id,
            ps.schedule_type,
            ps.day_of_week,
            ps.start_time,
            ps.end_time,
            ps.frequency_per_day,
            ps.week_of_month,
            ps.is_active,
            ps.created_at,
            ps.updated_at,
            b.barangay_name as actual_barangay_name,
            c.cluster_name
        FROM predefined_schedules ps
        LEFT JOIN barangay b ON ps.barangay_id = b.barangay_id
        LEFT JOIN cluster c ON ps.cluster_id = c.cluster_id
        WHERE ps.is_active = 1
    ";

    $where = [];
    $params = [];
    if ($scheduleType) { $where[] = 'ps.schedule_type = ?'; $params[] = $scheduleType; }
    if ($clusterId) { $where[] = 'ps.cluster_id = ?'; $params[] = $clusterId; }
    if ($weekOfMonth !== null && $weekOfMonth > 0) { $where[] = 'ps.week_of_month = ?'; $params[] = $weekOfMonth; }
    if (!empty($days)) {
        $in = implode(',', array_fill(0, count($days), '?'));
        $where[] = "ps.day_of_week IN ($in)";
        foreach ($days as $d) { $params[] = $d; }
    }

    if (!empty($where)) {
        $sql .= ' AND ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY ps.cluster_id, ps.day_of_week, ps.start_time';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If no schedules found, return empty array
    if (empty($schedules)) {
        echo json_encode([
            'success' => true,
            'message' => 'No predefined schedules found',
            'schedules' => []
        ]);
        exit();
    }
    
    // Process schedules to ensure consistent data format
    $processedSchedules = [];
    foreach ($schedules as $schedule) {
        $processedSchedules[] = [
            'schedule_template_id' => isset($schedule['schedule_template_id']) ? $schedule['schedule_template_id'] : null,
            'barangay_id' => $schedule['barangay_id'],
            'barangay_name' => $schedule['actual_barangay_name'] ?: $schedule['barangay_name'],
            'cluster_id' => $schedule['cluster_id'],
            'cluster_name' => $schedule['cluster_name'],
            'schedule_type' => $schedule['schedule_type'],
            'day_of_week' => $schedule['day_of_week'],
            'start_time' => $schedule['start_time'],
            'end_time' => $schedule['end_time'],
            'frequency_per_day' => $schedule['frequency_per_day'],
            'week_of_month' => $schedule['week_of_month'],
            'is_active' => $schedule['is_active'],
            'created_at' => $schedule['created_at'],
            'updated_at' => $schedule['updated_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Predefined schedules retrieved successfully',
        'schedules' => $processedSchedules,
        'total_count' => count($processedSchedules)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'schedules' => []
    ]);
}
?>
