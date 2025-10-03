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

try {
    // Get all assignments with their acceptance status
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
    ORDER BY a.date DESC, a.time DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $debug_info = [];
    foreach ($assignments as $assignment) {
        $driverAccepted = ($assignment['driver_response_status'] === 'accepted' || $assignment['driver_response_status'] === 'confirmed');
        $allCollectorsAccepted = ($assignment['total_collectors'] > 0 && $assignment['total_collectors'] == $assignment['accepted_collectors']);
        $allAccepted = $driverAccepted && $allCollectorsAccepted;
        
        $debug_info[] = [
            'assignment_id' => $assignment['assignment_id'],
            'barangay_id' => $assignment['barangay_id'],
            'date' => $assignment['date'],
            'time' => $assignment['time'],
            'driver_status' => $assignment['driver_response_status'],
            'total_collectors' => $assignment['total_collectors'],
            'accepted_collectors' => $assignment['accepted_collectors'],
            'driver_accepted' => $driverAccepted,
            'all_collectors_accepted' => $allCollectorsAccepted,
            'all_accepted' => $allAccepted
        ];
    }
    
    echo json_encode([
        'success' => true,
        'assignments' => $debug_info
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
