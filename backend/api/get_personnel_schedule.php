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
$database = new Database();
$db = $database->connect();

// Get user_id and role from query parameters
$user_id = $_GET['user_id'] ?? null;
$role = $_GET['role'] ?? null; // 'driver' or 'collector'

if (!$user_id || !$role) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required parameters: user_id and role'
    ]);
    exit();
}

try {
    $schedules = [];
    
    if ($role === 'driver') {
        // Get schedules for driver where team status is 'accepted' or 'confirmed'
        $query = "SELECT 
                    cs.schedule_id,
                    cs.scheduled_date,
                    cs.start_time,
                    cs.end_time,
                    cs.status as schedule_status,
                    b.barangay_name,
                    ct.team_id,
                    ct.status as team_status,
                    t.plate_num,
                    t.truck_type,
                    t.capacity
                  FROM collection_team ct
                  JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id
                  JOIN barangay b ON cs.barangay_id = b.barangay_id
                  LEFT JOIN truck t ON ct.truck_id = t.truck_id
                  WHERE ct.driver_id = ? 
                    AND ct.status IN ('accepted', 'confirmed')
                    AND cs.status IN ('scheduled', 'pending')
                  ORDER BY cs.scheduled_date ASC, cs.start_time ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$user_id]);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } elseif ($role === 'collector') {
        // Get unique team/schedule rows for this collector using EXISTS to avoid duplicates from member joins
        $query = "SELECT 
                    cs.schedule_id,
                    cs.scheduled_date,
                    cs.start_time,
                    cs.end_time,
                    cs.status as schedule_status,
                    b.barangay_name,
                    ct.team_id,
                    ct.status as team_status,
                    uctm.response_status,
                    t.plate_num,
                    t.truck_type,
                    t.capacity,
                    u.username as driver_username
                  FROM collection_team ct
                  JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id
                  JOIN barangay b ON cs.barangay_id = b.barangay_id
                  LEFT JOIN truck t ON ct.truck_id = t.truck_id
                  LEFT JOIN user u ON ct.driver_id = u.user_id
                  JOIN (
                    SELECT DISTINCT ctm.team_id, ctm.response_status
                    FROM collection_team_member ctm
                    WHERE ctm.collector_id = :uid
                      AND ctm.response_status IN ('accepted','confirmed','pending')
                  ) uctm ON uctm.team_id = ct.team_id
                  WHERE ct.status IN ('accepted', 'confirmed', 'pending')
                    AND cs.status IN ('scheduled', 'pending')
                  ORDER BY cs.scheduled_date ASC, cs.start_time ASC";

        $stmt = $db->prepare($query);
        $stmt->execute([':uid' => $user_id]);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid role. Must be "driver" or "collector"'
        ]);
        exit();
    }

    // Format the schedules for frontend consumption
    $formattedSchedules = [];
    foreach ($schedules as $schedule) {
        // Collectors
        $collectors = [];
        if (!empty($schedule['team_id'])) {
            $stmtC = $db->prepare("SELECT u.username, ctm.response_status FROM collection_team_member ctm JOIN user u ON u.user_id = ctm.collector_id WHERE ctm.team_id = ?");
            $stmtC->execute([$schedule['team_id']]);
            $collectors = $stmtC->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
        
        $formattedSchedules[] = [
            'schedule_id' => $schedule['schedule_id'],
            'team_id' => $schedule['team_id'],
            'date' => $schedule['scheduled_date'],
            'time' => $schedule['start_time'],
            'end_time' => $schedule['end_time'],
            'barangay' => $schedule['barangay_name'],
            'status' => $schedule['schedule_status'],
            'team_status' => $schedule['team_status'],
            'truck_number' => $schedule['plate_num'] ?? 'N/A',
            'truck_model' => $schedule['truck_type'] ?? 'N/A',
            'truck_capacity' => isset($schedule['capacity']) ? (int)$schedule['capacity'] : null,
            'your_response_status' => isset($schedule['response_status']) ? $schedule['response_status'] : ($schedule['team_status'] ?? null),
            'driver_name' => $schedule['driver_username'] ?? 'N/A',
            'collectors' => $collectors
        ];
    }

    echo json_encode([
        'success' => true,
        'schedules' => $formattedSchedules,
        'count' => count($formattedSchedules)
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
