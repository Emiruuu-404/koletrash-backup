<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
header('Content-Type: application/json');
require_once '../config/database.php';

$pdo = null;

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$driver_id = $data['driver_id'] ?? null;
$collector_ids = $data['collector_ids'] ?? [];
$truck_id = $data['truck_id'] ?? null;
$date = $data['date'] ?? null;
$time = $data['time'] ?? null;
$barangay_id = $data['barangay_id'] ?? null;

if (!$driver_id || !$truck_id || !$date || !$time || !$barangay_id) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields.'
    ]);
    exit();
}

try {
    $database = new Database();
    $pdo = $database->connect();

    if (!$pdo) {
        throw new Exception('Database connection failed.');
    }
    $pdo->beginTransaction();

    // Check if there's already a pending assignment for this barangay, date, and time
    $stmt = $pdo->prepare("SELECT team_id FROM collection_team ct 
                          JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
                          WHERE cs.barangay_id = ? AND cs.scheduled_date = ? AND cs.start_time = ?");
    $stmt->execute([$barangay_id, $date, $time]);
    if ($stmt->fetch()) {
        throw new Exception("There is already an assignment for this barangay, date, and time.");
    }

    // Availability check: truck
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM collection_team ct 
                          JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
                          WHERE ct.truck_id = ? AND cs.scheduled_date = ? AND cs.start_time = ?");
    $stmt->execute([$truck_id, $date, $time]);
    if ($stmt->fetchColumn() > 0) {
        throw new Exception("Selected truck is already assigned at this date and time.");
    }

    // Availability check: driver
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM collection_team ct 
                          JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
                          WHERE ct.driver_id = ? AND cs.scheduled_date = ? AND cs.start_time = ?");
    $stmt->execute([$driver_id, $date, $time]);
    if ($stmt->fetchColumn() > 0) {
        throw new Exception("Selected driver is already assigned at this date and time.");
    }

    // Availability check: collectors
    foreach ($collector_ids as $cid) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM collection_team_member ctm 
                              JOIN collection_team ct ON ctm.team_id = ct.team_id 
                              JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
                              WHERE ctm.collector_id = ? AND cs.scheduled_date = ? AND cs.start_time = ?");
        $stmt->execute([$cid, $date, $time]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception("One or more selected collectors are already assigned at this date and time.");
        }
    }

    // Create a temporary schedule with 'pending' status (not 'scheduled')
    $stmt = $pdo->prepare("INSERT INTO collection_schedule (barangay_id, scheduled_date, start_time, end_time, status) VALUES (?, ?, ?, ?, 'pending')");
    $end_time = date('H:i:s', strtotime($time . ' +2 hours')); // Default 2 hours duration
    $stmt->execute([$barangay_id, $date, $time, $end_time]);
    $schedule_id = $pdo->lastInsertId();

    // Insert collection team with 'pending' status
    $stmt = $pdo->prepare("INSERT INTO collection_team (schedule_id, truck_id, driver_id, status) VALUES (?, ?, ?, 'pending')");
    $stmt->execute([$schedule_id, $truck_id, $driver_id]);
    $team_id = $pdo->lastInsertId();

    // Insert collectors for this team with 'pending' status
    $stmt = $pdo->prepare("INSERT INTO collection_team_member (team_id, collector_id, response_status) VALUES (?, ?, 'pending')");
    foreach ($collector_ids as $cid) {
        $stmt->execute([$team_id, $cid]);
    }
    
    // Note: Driver status is tracked in collection_team.status field, not in collection_team_member

    // Prepare notification message
    $notifData = [
        'type' => 'assignment',
        'team_id' => $team_id,
        'message' => "You have been assigned a new waste collection task for barangay $barangay_id on $date at $time.",
        'date' => $date,
        'time' => $time,
        'barangay_id' => $barangay_id,
        'status' => 'pending'
    ];
    $notifMsg = json_encode($notifData);

    // Insert notification for driver
    $stmtNotif = $pdo->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
    $stmtNotif->execute([$driver_id, $notifMsg]);

    // Insert notification for each collector
    foreach ($collector_ids as $cid) {
        $stmtNotif->execute([$cid, $notifMsg]);
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Task assigned and personnel notified. Schedule will be confirmed once all personnel accept.',
        'team_id' => $team_id
    ]);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
