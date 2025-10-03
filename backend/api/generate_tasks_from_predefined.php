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

$data = json_decode(file_get_contents('php://input'), true);
$start_date = $data['start_date'] ?? null;
$end_date = $data['end_date'] ?? null;
$overwrite = isset($data['overwrite']) ? (bool)$data['overwrite'] : false;

if (!$start_date || !$end_date) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields: start_date and end_date']);
    exit();
}

try {
    $database = new Database();
    $db = $database->connect();
    $db->beginTransaction();
    
    // Get predefined schedules
    $stmt = $db->prepare("SELECT * FROM predefined_schedules WHERE is_active = 1");
    $stmt->execute();
    $predefinedSchedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get available personnel
    // Truck drivers (role_id = 3)
    $stmt = $db->prepare("
        SELECT u.user_id, u.username, 
               CONCAT(up.firstname, ' ', up.lastname) as full_name,
               up.status
        FROM user u 
        LEFT JOIN user_profile up ON u.user_id = up.user_id 
        WHERE u.role_id = 3 AND (up.status = 'active' OR up.status = 'online')
    ");
    $stmt->execute();
    $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Garbage collectors (role_id = 4)
    $stmt = $db->prepare("
        SELECT u.user_id, u.username, 
               CONCAT(up.firstname, ' ', up.lastname) as full_name,
               up.status
        FROM user u 
        LEFT JOIN user_profile up ON u.user_id = up.user_id 
        WHERE u.role_id = 4 AND (up.status = 'active' OR up.status = 'online' OR up.status IS NULL)
    ");
    $stmt->execute();
    $collectors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get available trucks
    $stmt = $db->prepare("SELECT truck_id, plate_num, truck_type, capacity, status FROM truck WHERE status = 'available' OR status = 'Available'");
    $stmt->execute();
    $trucks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($drivers) || empty($collectors) || empty($trucks)) {
        throw new Exception("Insufficient personnel or trucks available. Found: " . count($drivers) . " drivers, " . count($collectors) . " collectors, " . count($trucks) . " trucks.");
    }

    // Need at least 2 drivers and 2 trucks for fixed assignment
    if (count($drivers) < 2 || count($trucks) < 2) {
        throw new Exception("Need at least 2 drivers and 2 trucks for fixed assignment. Found: " . count($drivers) . " drivers, " . count($trucks) . " trucks.");
    }
    
    $generatedTasks = [];
    // Aggregate notifications per recipient per day
    $recipientNotifications = [];
    $skippedDuplicates = 0;
    $currentDate = new DateTime($start_date);
    $endDateTime = new DateTime($end_date);
    
    // Fixed driver assignment to avoid conflicts
    $priorityDriver = $drivers[0]; // First driver for priority barangays (1C-PB)
    $clusteredDriver = $drivers[1]; // Second driver for clustered barangays (2C-CA, 3C-CB, 4C-CC, 5C-CD)
    
    // Fixed truck assignment
    $priorityTruck = $trucks[0]; // First truck for priority barangays
    $clusteredTruck = $trucks[1]; // Second truck for clustered barangays
    
    // Create separate collector teams for Priority and Clustered barangays
    // Need at least 6 collectors (3 for priority, 3 for clustered)
    if (count($collectors) < 6) {
        throw new Exception("Need at least 6 collectors for separate priority and clustered teams. Found: " . count($collectors) . " collectors.");
    }
    
    // Split collectors into two groups
    $midPoint = ceil(count($collectors) / 2);
    $priorityCollectors = array_slice($collectors, 0, $midPoint);
    $clusteredCollectors = array_slice($collectors, $midPoint);
    
    // Create teams for Priority barangays (3 collectors per team)
    $priorityCollectorTeams = [];
    $collectorsPerTeam = 3;
    $priorityTeamCount = ceil(count($priorityCollectors) / $collectorsPerTeam);
    
    for ($i = 0; $i < $priorityTeamCount; $i++) {
        $team = [];
        for ($j = 0; $j < $collectorsPerTeam; $j++) {
            $collectorIndex = ($i * $collectorsPerTeam) + $j;
            if ($collectorIndex < count($priorityCollectors)) {
                $team[] = $priorityCollectors[$collectorIndex];
            }
        }
        if (count($team) >= 3) {
            $priorityCollectorTeams[] = $team;
        }
    }
    
    // Create teams for Clustered barangays (3 collectors per team)
    $clusteredCollectorTeams = [];
    $clusteredTeamCount = ceil(count($clusteredCollectors) / $collectorsPerTeam);
    
    for ($i = 0; $i < $clusteredTeamCount; $i++) {
        $team = [];
        for ($j = 0; $j < $collectorsPerTeam; $j++) {
            $collectorIndex = ($i * $collectorsPerTeam) + $j;
            if ($collectorIndex < count($clusteredCollectors)) {
                $team[] = $clusteredCollectors[$collectorIndex];
            }
        }
        if (count($team) >= 3) {
            $clusteredCollectorTeams[] = $team;
        }
    }
    
    if (empty($priorityCollectorTeams) || empty($clusteredCollectorTeams)) {
        throw new Exception("Failed to create collector teams. Priority teams: " . count($priorityCollectorTeams) . ", Clustered teams: " . count($clusteredCollectorTeams));
    }
    
    // Track assignments to ensure rotation
    $assignmentCounter = 0;
    
    while ($currentDate <= $endDateTime) {
        $date = $currentDate->format('Y-m-d');
        $dayName = $currentDate->format('l');
        $weekOfMonth = ceil($currentDate->format('j') / 7);
        
        // Skip weekends
        if ($currentDate->format('w') == 0 || $currentDate->format('w') == 6) {
            $currentDate->add(new DateInterval('P1D'));
            continue;
        }
        
        foreach ($predefinedSchedules as $schedule) {
            // Check if schedule matches current day
            if ($schedule['day_of_week'] === $dayName) {
                // For weekly clusters, check week of month
                if ($schedule['schedule_type'] === 'weekly_cluster') {
                    if ($schedule['week_of_month'] != $weekOfMonth) {
                        continue;
                    }
                }
                
                // Check if task already exists
                $stmt = $db->prepare("SELECT schedule_id FROM collection_schedule WHERE barangay_id = ? AND scheduled_date = ? AND start_time = ?");
                $stmt->execute([$schedule['barangay_id'], $date, $schedule['start_time']]);
                $existingId = $stmt->fetchColumn();
                if ($existingId && !$overwrite) {
                    $skippedDuplicates++;
                    continue;
                }
                if ($existingId && $overwrite) {
                    // delete existing schedule and cascade team if needed
                    $db->prepare("DELETE FROM collection_team_member WHERE team_id IN (SELECT team_id FROM collection_team WHERE schedule_id = ?)")->execute([$existingId]);
                    $db->prepare("DELETE FROM collection_team WHERE schedule_id = ?")->execute([$existingId]);
                    $db->prepare("DELETE FROM collection_schedule WHERE schedule_id = ?")->execute([$existingId]);
                }

                {
                    // Select personnel for this task based on cluster type
                    if ($schedule['cluster_id'] === '1C-PB') {
                        // Priority barangays - use first driver and truck
                        $driver = $priorityDriver;
                        $truck = $priorityTruck;
                    } else {
                        // Clustered barangays - use second driver and truck
                        $driver = $clusteredDriver;
                        $truck = $clusteredTruck;
                    }
                    
                    // Select appropriate collector team based on barangay type
                    $dayOfYear = $currentDate->format('z');
                    
                    if ($schedule['cluster_id'] === '1C-PB') {
                        // Priority barangays - use priority collector teams
                        $teamIndex = $dayOfYear % count($priorityCollectorTeams);
                        $selectedCollectors = $priorityCollectorTeams[$teamIndex];
                        $teamType = 'Priority Team ' . ($teamIndex + 1);
                    } else {
                        // Clustered barangays - use clustered collector teams
                        $teamIndex = $dayOfYear % count($clusteredCollectorTeams);
                        $selectedCollectors = $clusteredCollectorTeams[$teamIndex];
                        $teamType = 'Clustered Team ' . ($teamIndex + 1);
                    }
                    
                    // Create schedule first
                    $stmt = $db->prepare("INSERT INTO collection_schedule (barangay_id, scheduled_date, start_time, end_time, status) VALUES (?, ?, ?, ?, 'pending')");
                    $stmt->execute([$schedule['barangay_id'], $date, $schedule['start_time'], $schedule['end_time']]);
                    $schedule_id = $db->lastInsertId();
                    
                    // Create collection team
                    $stmt = $db->prepare("INSERT INTO collection_team (schedule_id, truck_id, driver_id, status) VALUES (?, ?, ?, 'pending')");
                    $stmt->execute([$schedule_id, $truck['truck_id'], $driver['user_id']]);
                    $team_id = $db->lastInsertId();
                    
                    // Assign collectors
                    $stmt = $db->prepare("INSERT INTO collection_team_member (team_id, collector_id, response_status) VALUES (?, ?, 'pending')");
                    foreach ($selectedCollectors as $collector) {
                        $stmt->execute([$team_id, $collector['user_id']]);
                    }
                    
                    // Queue aggregated notifications for this recipient list
                    $assignmentEntry = [
                        'team_id' => (int)$team_id,
                        'barangay' => $schedule['barangay_name'],
                        'cluster' => $schedule['cluster_id'],
                        'date' => $date,
                        'time' => $schedule['start_time'],
                        'type' => $schedule['schedule_type'],
                        'truck' => $truck['plate_num']
                    ];
                    // Driver
                    $recipientId = (int)$driver['user_id'];
                    if (!isset($recipientNotifications[$recipientId])) { $recipientNotifications[$recipientId] = []; }
                    $recipientNotifications[$recipientId][] = $assignmentEntry;
                    // Collectors
                    foreach ($selectedCollectors as $collector) {
                        $rid = (int)$collector['user_id'];
                        if (!isset($recipientNotifications[$rid])) { $recipientNotifications[$rid] = []; }
                        $recipientNotifications[$rid][] = $assignmentEntry;
                    }
                    
                    $generatedTasks[] = [
                        'barangay_name' => $schedule['barangay_name'],
                        'barangay_id' => $schedule['barangay_id'],
                        'cluster_id' => $schedule['cluster_id'],
                        'date' => $date,
                        'time' => $schedule['start_time'],
                        'type' => $schedule['schedule_type'],
                        'driver' => $driver['full_name'] ?: $driver['username'],
                        'collectors' => array_map(function($c) { return $c['full_name'] ?: $c['username']; }, $selectedCollectors),
                        'truck' => $truck['plate_num'],
                        'team_id' => $team_id,
                        'assignment_type' => $schedule['cluster_id'] === '1C-PB' ? 'Priority Assignment' : 'Clustered Assignment',
                        'collector_team' => $teamType
                    ];
                    
                    $assignmentCounter++;
                }
            }
        }
        
        $currentDate->add(new DateInterval('P1D'));
    }
    
    // After generating all tasks for the requested date range, persist one notification per recipient per date
    if (!empty($recipientNotifications)) {
        $stmtNotif = $db->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
        foreach ($recipientNotifications as $recipientId => $assignments) {
            // Group assignments by date for safety, but payload still includes all entries
            $payload = [
                'type' => 'daily_assignments',
                'date' => $start_date === $end_date ? $start_date : null,
                'assignments' => $assignments
            ];
            $stmtNotif->execute([$recipientId, json_encode($payload)]);
        }
    }

    $db->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Tasks generated successfully from predefined schedules',
        'generated_tasks' => $generatedTasks,
        'total_generated' => count($generatedTasks),
        'skipped_duplicates' => $skippedDuplicates,
        'overwrite' => $overwrite
    ]);
    
} catch (Exception $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
