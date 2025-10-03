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
    // Fetch all collection teams with their details
    $query = "SELECT 
        ct.team_id as assignment_id,
        ct.schedule_id,
        ct.truck_id,
        ct.driver_id,
        ct.status,
        cs.scheduled_date as date,
        cs.start_time as time,
        cs.barangay_id,
        b.barangay_name,
        t.plate_num as truck_plate,
        t.truck_type,
        t.capacity as truck_capacity,
        t.status as truck_status,
        u.username as driver_name
    FROM collection_team ct
    LEFT JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id
    LEFT JOIN barangay b ON cs.barangay_id = b.barangay_id
    LEFT JOIN truck t ON ct.truck_id = t.truck_id
    LEFT JOIN user u ON ct.driver_id = u.user_id
    ORDER BY cs.scheduled_date DESC, cs.start_time DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $assignments = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Get collectors for this team
        $collectorsQ = $db->prepare("
            SELECT 
                ctm.collector_id,
                u.username,
                ctm.response_status
            FROM collection_team_member ctm 
            JOIN user u ON ctm.collector_id = u.user_id 
            WHERE ctm.team_id = ?
        ");
        $collectorsQ->execute([$row['assignment_id']]);
        $collectors = [];
        
        while ($c = $collectorsQ->fetch(PDO::FETCH_ASSOC)) {
            $collectors[] = [
                'id' => $c['collector_id'],
                'name' => $c['username'],
                'status' => $c['response_status'] ?: 'pending',
            ];
        }

        // Get driver info - driver status is in collection_team.status
        $driver = null;
        if ($row['driver_id']) {
            $driver = [
                'id' => $row['driver_id'],
                'name' => $row['driver_name'],
                'status' => $row['status'] ?: 'pending',
            ];
        }

        // Calculate overall assignment status based on all personnel responses
        $overallStatus = 'pending';
        $totalPersonnel = count($collectors) + ($driver ? 1 : 0);
        $acceptedPersonnel = 0;
        $declinedPersonnel = 0;
        
        // Count accepted and declined personnel
        if ($driver && $driver['status'] === 'accepted') $acceptedPersonnel++;
        if ($driver && $driver['status'] === 'declined') $declinedPersonnel++;
        
        foreach ($collectors as $collector) {
            if ($collector['status'] === 'accepted') $acceptedPersonnel++;
            if ($collector['status'] === 'declined') $declinedPersonnel++;
        }
        
        // Determine overall status
        if ($totalPersonnel > 0) {
            if ($declinedPersonnel > 0) {
                $overallStatus = 'declined';
            } elseif ($acceptedPersonnel === $totalPersonnel) {
                $overallStatus = 'accepted';
            } else {
                $overallStatus = 'pending';
            }
        }

        $assignments[] = [
            'assignment_id' => $row['assignment_id'],
            'barangay_id' => $row['barangay_id'],
            'barangay_name' => $row['barangay_name'],
            'date' => $row['date'],
            'time' => $row['time'],
            'driver' => $driver,
            'collectors' => $collectors,
            'truck_plate' => $row['truck_plate'],
            'truck_type' => $row['truck_type'],
            'truck_capacity' => $row['truck_capacity'],
            'truck_status' => $row['truck_status'],
            'status' => $overallStatus, // Use the calculated overall status
        ];
    }
    
    echo json_encode([
        'success' => true,
        'assignments' => $assignments
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} 
