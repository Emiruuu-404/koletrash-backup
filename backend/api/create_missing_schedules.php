<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
$database = new Database();
$db = $database->connect();

try {
    $db->beginTransaction();
    
    // Find all assignments where all personnel have accepted but no schedule entry exists
    $query = "SELECT 
        a.assignment_id,
        a.barangay_id,
        a.driver_id,
        a.driver_response_status,
        a.date,
        a.time,
        COUNT(ac.collector_id) as total_collectors,
        SUM(CASE WHEN ac.response_status IN ('accepted', 'confirmed') THEN 1 ELSE 0 END) as accepted_collectors
    FROM assignment a
    LEFT JOIN assignment_collector ac ON a.assignment_id = ac.assignment_id
    GROUP BY a.assignment_id, a.barangay_id, a.driver_id, a.driver_response_status, a.date, a.time
    HAVING 
        (a.driver_response_status = 'accepted' OR a.driver_response_status = 'confirmed')
        AND (COUNT(ac.collector_id) = 0 OR COUNT(ac.collector_id) = SUM(CASE WHEN ac.response_status IN ('accepted', 'confirmed') THEN 1 ELSE 0 END))
        AND COUNT(ac.collector_id) > 0";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $acceptedAssignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get a valid user_id for created_by (use admin user)
    $stmt = $db->prepare("SELECT user_id FROM user WHERE username = 'admin' LIMIT 1");
    $stmt->execute();
    $adminUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $created_by = $adminUser ? $adminUser['user_id'] : 1; // fallback to user_id 1
    
    $createdSchedules = [];
    $errors = [];
    
    foreach ($acceptedAssignments as $assignment) {
        // Check if schedule entry already exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM collection_schedule WHERE barangay_id = ? AND scheduled_date = ? AND start_time = ?");
        $stmt->execute([$assignment['barangay_id'], $assignment['date'], $assignment['time']]);
        
        if ($stmt->fetchColumn() == 0) {
            // Create schedule entry - use NULL for type_id since collection_type table is empty
            $stmt = $db->prepare("INSERT INTO collection_schedule (barangay_id, type_id, scheduled_date, created_by, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            // Set default values for missing fields
            $type_id = null; // Use NULL since collection_type table is empty
            $end_time = date('H:i:s', strtotime($assignment['time'] . ' +2 hours')); // Default 2 hours duration
            $status = 'scheduled';
            
            if ($stmt->execute([
                $assignment['barangay_id'],
                $type_id,
                $assignment['date'],
                $created_by,
                $assignment['time'],
                $end_time,
                $status
            ])) {
                $createdSchedules[] = [
                    'assignment_id' => $assignment['assignment_id'],
                    'barangay_id' => $assignment['barangay_id'],
                    'date' => $assignment['date'],
                    'time' => $assignment['time']
                ];
            } else {
                $errors[] = "Failed to create schedule for assignment " . $assignment['assignment_id'];
            }
        }
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Missing schedules created successfully',
        'created_schedules' => $createdSchedules,
        'total_created' => count($createdSchedules),
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?> 
