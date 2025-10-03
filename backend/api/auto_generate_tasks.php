<?php
// Layunin: Script na awtomatikong lumilikha ng tasks (schedules at teams)
//          base sa saklaw ng petsa at cluster (priority vs clustered).
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
header('Content-Type: application/json');
require_once '../config/database.php';

// Get POST data
// Mga input na inaasahan mula sa client
$data = json_decode(file_get_contents('php://input'), true);

$start_date = $data['start_date'] ?? null;
$end_date = $data['end_date'] ?? null;
$cluster = $data['cluster'] ?? null;

if (!$start_date || !$end_date) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: start_date and end_date.'
    ]);
    exit();
}

try {
    // Kumonekta sa database at simulan ang transaction
    $pdo = new PDO("mysql:host=localhost;dbname=kolektrash_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->beginTransaction();

    // Get available personnel - using the same structure as get_personnel.php
    // Truck drivers (role_id = 3) - include online status
    $stmt = $pdo->prepare("
        SELECT u.user_id, u.username, 
               CONCAT(up.firstname, ' ', up.lastname) as full_name,
               up.status
        FROM user u 
        LEFT JOIN user_profile up ON u.user_id = up.user_id 
        WHERE u.role_id = 3 AND (up.status = 'active' OR up.status = 'online')
    ");
    $stmt->execute();
    $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Garbage collectors (role_id = 4) - include online status and null status
    $stmt = $pdo->prepare("
        SELECT u.user_id, u.username, 
               CONCAT(up.firstname, ' ', up.lastname) as full_name,
               up.status
        FROM user u 
        LEFT JOIN user_profile up ON u.user_id = up.user_id 
        WHERE u.role_id = 4 AND (up.status = 'active' OR up.status = 'online' OR up.status IS NULL)
    ");
    $stmt->execute();
    $collectors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get available trucks - check for both 'available' and 'Available'
    $stmt = $pdo->prepare("SELECT truck_id, plate_num, truck_type, capacity, status FROM truck WHERE status = 'available' OR status = 'Available'");
    $stmt->execute();
    $trucks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Always fetch all barangays
    $stmt = $pdo->prepare("SELECT barangay_id, barangay_name, cluster_id FROM barangay ORDER BY barangay_name");
    $stmt->execute();
    $allBarangays = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Now, filter for the selected cluster if needed
    if ($cluster && $cluster !== '1C-PB') {
        $barangays = array_filter($allBarangays, function($b) use ($cluster) {
            return $b['cluster_id'] === $cluster;
        });
    } else if ($cluster === '1C-PB') {
        $barangays = array_filter($allBarangays, function($b) {
            return $b['cluster_id'] === '1C-PB';
        });
    } else {
        $barangays = $allBarangays;
    }

    // --- NEW LOGIC: Fix driver/truck per group ---
    // Identify priority and clustered barangays
    // Define schedule rules for each barangay
    $prioritySchedules = [
        'North Centro' => [
            'days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'frequency_per_day' => 4
        ],
        'South Centro' => [
            'days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'frequency_per_day' => 4
        ],
        'Impig' => [
            'days' => ['Monday', 'Wednesday', 'Friday'],
            'frequency_per_day' => 1
        ],
        'Malubago' => [
            'days' => ['Tuesday', 'Friday'],
            'frequency_per_day' => 1
        ],
        'Tara' => [
            'days' => ['Monday', 'Wednesday', 'Friday'],
            'frequency_per_day' => 1
        ],
        'Gaongan' => [
            'days' => ['Thursday'],
            'frequency_per_day' => 1
        ],
        'Azucena' => [
            'days' => ['Friday'],
            'frequency_per_day' => 1
        ]
    ];
    $priorityBarangayNames = array_keys($prioritySchedules);
    $priorityBarangays = array_filter($barangays, function($b) use ($priorityBarangayNames) {
        return in_array($b['barangay_name'], $priorityBarangayNames);
    });
    $clusteredBarangays = array_filter($barangays, function($b) use ($priorityBarangayNames) {
        return !in_array($b['barangay_name'], $priorityBarangayNames);
    });

    // Need at least 2 drivers and 2 trucks for separate assignments
    if (count($drivers) < 2 || count($trucks) < 2) {
        throw new Exception("Need at least 2 drivers and 2 trucks for separate assignments (priority and clustered barangays). Found: " . count($drivers) . " drivers, " . count($trucks) . " trucks.");
    }

    // Assign fixed driver/truck for each group
    $priorityDriver = $drivers[0];
    $priorityTruck = $trucks[0];
    $clusteredDriver = $drivers[1];
    $clusteredTruck = $trucks[1];

    if (empty($drivers) || empty($collectors) || empty($trucks) || empty($barangays)) {
        $missing = [];
        if (empty($drivers)) $missing[] = "truck drivers";
        if (empty($collectors)) $missing[] = "garbage collectors";
        if (empty($trucks)) $missing[] = "available trucks";
        if (empty($barangays)) $missing[] = "barangays";
        
        throw new Exception("Insufficient data for task generation. Missing: " . implode(", ", $missing) . 
                          ". Found: " . count($drivers) . " drivers, " . count($collectors) . " collectors, " . 
                          count($trucks) . " trucks, " . count($barangays) . " barangays.");
    }

    $generatedTasks = [];
    $currentDate = new DateTime($start_date);
    $endDateTime = new DateTime($end_date);
    
    // Create rotating pools for better distribution
    $driverPool = $drivers;
    $collectorPool = $collectors;
    $truckPool = $trucks;
    
    // Track assignments to ensure rotation
    $assignmentCounter = 0;
    
    // Add cluster week mapping
    $clusterWeeks = [
        '2C-CA' => 1, // Cluster A
        '3C-CB' => 2, // Cluster B
        '4C-CC' => 3, // Cluster C
        '5C-CD' => 4  // Cluster D
    ];

    // Function to get week of the month
    // Kunin ang ika-ilang linggo ng buwan batay sa petsa (1-4/5)
    function getWeekOfMonth($date) {
        $firstDay = new DateTime($date->format('Y-m-01'));
        $dayOfMonth = (int)$date->format('j');
        $weekDayOfFirst = (int)$firstDay->format('N'); // 1 (Mon) - 7 (Sun)
        return intval(ceil(($dayOfMonth + $weekDayOfFirst - 1) / 7));
    }
    
    // Generate tasks for each day in the date range
    while ($currentDate <= $endDateTime) {
        $date = $currentDate->format('Y-m-d');
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        // Laktawan ang Sabado at Linggo
        $dayOfWeek = $currentDate->format('w');
        if ($dayOfWeek == 0 || $dayOfWeek == 6) {
            $currentDate->add(new DateInterval('P1D'));
            continue;
        }

        // Gather all scheduled barangays for the current day
        $scheduledBarangays = [];
        // Priority barangays: gather all scheduled for the day
        $priorityScheduled = [];
        foreach ($barangays as $barangay) {
            $bName = $barangay['barangay_name'];
            $clusterId = $barangay['cluster_id'];
            if ($clusterId === '1C-PB' && isset($prioritySchedules[$bName])) {
                $schedule = $prioritySchedules[$bName];
                $dayName = $currentDate->format('l');
                $dayOfMonth = $currentDate->format('j');
                $isScheduled = false;
                if ($bName === 'Taisan') {
                    $isFirstThursday = ($dayName === 'Thursday' && $dayOfMonth <= 7);
                    $isScheduled = $isFirstThursday;
                } else {
                    $isScheduled = in_array($dayName, $schedule['days']);
                }
                if ($isScheduled) {
                    for ($i = 0; $i < $schedule['frequency_per_day']; $i++) {
                        $priorityScheduled[] = $barangay;
                    }
                }
            }
        }
        // Generate enough time slots for all priority assignments
        // Gumawa ng sapat na oras (hourly) para sa lahat ng priority tasks
        $startTime = new DateTime('08:00');
        $priorityTimeSlots = [];
        for ($i = 0; $i < count($priorityScheduled); $i++) {
            $priorityTimeSlots[] = $startTime->format('H:i');
            $startTime->add(new DateInterval('PT1H'));
        }
        // Assign each priority barangay to a unique time slot
        // --- PRIORITY BARANGAY ASSIGNMENTS ---
        // Gumawa ng schedule at team para sa bawat priority barangay gamit ang nakapirming driver/truck
        foreach ($priorityScheduled as $idx => $barangay) {
            $date = $currentDate->format('Y-m-d');
            $time = $priorityTimeSlots[$idx];
            $bName = $barangay['barangay_name'];
            $clusterId = $barangay['cluster_id'];
            // Check if assignment already exists for this barangay, date, and time
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM collection_team ct 
                                  JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
                                  WHERE cs.barangay_id = ? AND cs.scheduled_date = ? AND cs.start_time = ?");
            $stmt->execute([$barangay['barangay_id'], $date, $time]);
            if ($stmt->fetchColumn() > 0) {
                continue; // Skip if already assigned
            }
            // Use fixed driver/truck for priority
            $driver = $priorityDriver;
            $truck = $priorityTruck;
            // Randomly select 3 unique collectors
            $availableCollectors = $collectorPool;
            if (count($availableCollectors) < 3) continue;
            $collectorKeys = array_rand($availableCollectors, 3);
            $selectedCollectors = [
                $availableCollectors[$collectorKeys[0]],
                $availableCollectors[$collectorKeys[1]],
                $availableCollectors[$collectorKeys[2]]
            ];
            
            // Create schedule first
            // Mag-insert sa collection_schedule (2 oras na tagal bawat task)
            $stmt = $pdo->prepare("INSERT INTO collection_schedule (barangay_id, scheduled_date, start_time, end_time, status) VALUES (?, ?, ?, ?, 'pending')");
            $end_time = date('H:i:s', strtotime($time . ' +2 hours'));
            $stmt->execute([$barangay['barangay_id'], $date, $time, $end_time]);
            $schedule_id = $pdo->lastInsertId();
            
            // Create collection team
            // Mag-insert sa collection_team kasama ang truck at driver
            $stmt = $pdo->prepare("INSERT INTO collection_team (schedule_id, truck_id, driver_id, status) VALUES (?, ?, ?, 'pending')");
            $stmt->execute([$schedule_id, $truck['truck_id'], $driver['user_id']]);
            $team_id = $pdo->lastInsertId();
            
            // Assign collectors
            // Idagdag ang 3 collectors sa collection_team_member
            $stmt = $pdo->prepare("INSERT INTO collection_team_member (team_id, collector_id, response_status) VALUES (?, ?, 'pending')");
            foreach ($selectedCollectors as $collector) {
                $stmt->execute([$team_id, $collector['user_id']]);
            }
            
            // Create notifications
            // Lumikha ng notifications para sa driver at mga collectors
            $notifData = [
                'type' => 'assignment',
                'team_id' => $team_id,
                'message' => "Auto-assigned: Waste collection task for barangay {$barangay['barangay_name']} on $date at $time.",
                'date' => $date,
                'time' => $time,
                'cluster' => $clusterId,
                'barangay' => $barangay['barangay_name'],
                'status' => 'pending'
            ];
            $notifMsg = json_encode($notifData);
            // Notify driver
            $stmtNotif = $pdo->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
            $stmtNotif->execute([$driver['user_id'], $notifMsg]);
            // Notify collectors
            foreach ($selectedCollectors as $collector) {
                $stmtNotif->execute([$collector['user_id'], $notifMsg]);
            }
            $generatedTasks[] = [
                'team_id' => $team_id,
                'driver' => $driver['full_name'] ?: $driver['username'],
                'collectors' => array_map(function($c) { return $c['full_name'] ?: $c['username']; }, $selectedCollectors),
                'truck' => $truck['plate_num'],
                'cluster' => $clusterId,
                'barangay' => $barangay['barangay_name'],
                'date' => $date,
                'time' => $time
            ];
        }

        // --- CLUSTERED BARANGAY SCHEDULING BY OFFICIAL RULES ---
        $clusterWeekMap = [
            '2C-CA' => 1, // Cluster A: 1st week
            '3C-CB' => 2, // Cluster B: 2nd week
            '4C-CC' => 3, // Cluster C: 3rd week
            '5C-CD' => 4  // Cluster D: 4th week
        ];
        $timeSlots = ['08:00', '10:00', '14:00', '16:00'];
        // Group clustered barangays by cluster_id
        // I-grupo ang mga barangay ayon sa cluster para maitugma sa tamang linggo
        $clusteredByCluster = [];
        foreach ($barangays as $b) {
            if (isset($clusterWeekMap[$b['cluster_id']])) {
                $clusteredByCluster[$b['cluster_id']][] = $b;
            }
        }
        // For each cluster, assign only in its designated week
        // Para sa bawat cluster, pumili ng lahat ng weekdays ng target na linggo
        foreach ($clusteredByCluster as $clusterId => $bList) {
            $targetWeek = $clusterWeekMap[$clusterId];
            // Always generate all 5 weekdays (Mon-Fri) of the target week in the month of the start_date
            $month = (new DateTime($start_date))->format('Y-m');
            $weekDates = [];
            $dateIter = new DateTime("$month-01");
            $foundWeek = false;
            while ($dateIter->format('m') === substr($month, 5, 2)) {
                $weekOfMonth = getWeekOfMonth($dateIter);
                $dayOfWeek = $dateIter->format('N'); // 1=Mon, 7=Sun
                if ($weekOfMonth == $targetWeek && $dayOfWeek <= 5) { // Mon-Fri only
                    $weekDates[] = $dateIter->format('Y-m-d');
                    $foundWeek = true;
                } else if ($foundWeek && $weekOfMonth != $targetWeek) {
                    break; // Stop after the week
                }
                $dateIter->add(new DateInterval('P1D'));
            }
            // Assign each barangay to a slot in this week
            // I-assign ang bawat barangay sa nabuo na petsa at oras
            $slotCount = count($weekDates) * count($timeSlots);
            $bCount = count($bList);
            $assignments = [];
            $bIdx = 0;
            foreach ($weekDates as $d) {
                foreach ($timeSlots as $t) {
                    if ($bIdx >= $bCount) break 2;
                    $assignments[] = [
                        'barangay' => $bList[$bIdx],
                        'date' => $d,
                        'time' => $t
                    ];
                    $bIdx++;
                }
            }
            // Add to scheduledBarangays
            foreach ($assignments as $a) {
                $scheduledBarangays[] = $a;
            }
        }

        // For clustered, each barangay is already mapped to a date/time
        // I-apply ang assignments: gumawa ng schedule, team, at notifications
        // --- CLUSTERED BARANGAY ASSIGNMENTS ---
        foreach ($scheduledBarangays as $entry) {
            $barangay = $entry['barangay'];
            $date = $entry['date'];
            $time = $entry['time'];
            $bName = $barangay['barangay_name'];
            $clusterId = $barangay['cluster_id'];
            // Check if assignment already exists for this barangay, date, and time
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM collection_team ct 
                                  JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
                                  WHERE cs.barangay_id = ? AND cs.scheduled_date = ? AND cs.start_time = ?");
            $stmt->execute([$barangay['barangay_id'], $date, $time]);
            if ($stmt->fetchColumn() > 0) {
                continue; // Skip if already assigned
            }
            // Use fixed driver/truck for clustered
            $driver = $clusteredDriver;
            $truck = $clusteredTruck;
            // Randomly select 3 unique collectors
            $availableCollectors = $collectorPool;
            if (count($availableCollectors) < 3) continue;
            $collectorKeys = array_rand($availableCollectors, 3);
            $selectedCollectors = [
                $availableCollectors[$collectorKeys[0]],
                $availableCollectors[$collectorKeys[1]],
                $availableCollectors[$collectorKeys[2]]
            ];
            
            // Create schedule first
            // Mag-insert sa collection_schedule (2 oras na tagal bawat task)
            $stmt = $pdo->prepare("INSERT INTO collection_schedule (barangay_id, scheduled_date, start_time, end_time, status) VALUES (?, ?, ?, ?, 'pending')");
            $end_time = date('H:i:s', strtotime($time . ' +2 hours'));
            $stmt->execute([$barangay['barangay_id'], $date, $time, $end_time]);
            $schedule_id = $pdo->lastInsertId();
            
            // Create collection team
            // Mag-insert sa collection_team kasama ang truck at driver
            $stmt = $pdo->prepare("INSERT INTO collection_team (schedule_id, truck_id, driver_id, status) VALUES (?, ?, ?, 'pending')");
            $stmt->execute([$schedule_id, $truck['truck_id'], $driver['user_id']]);
            $team_id = $pdo->lastInsertId();
            
            // Assign collectors
            // Idagdag ang 3 collectors sa collection_team_member
            $stmt = $pdo->prepare("INSERT INTO collection_team_member (team_id, collector_id, response_status) VALUES (?, ?, 'pending')");
            foreach ($selectedCollectors as $collector) {
                $stmt->execute([$team_id, $collector['user_id']]);
            }
            
            // Create notifications
            // Lumikha ng notifications para sa driver at mga collectors
            $notifData = [
                'type' => 'assignment',
                'team_id' => $team_id,
                'message' => "Auto-assigned: Waste collection task for barangay {$barangay['barangay_name']} on $date at $time.",
                'date' => $date,
                'time' => $time,
                'cluster' => $clusterId,
                'barangay' => $barangay['barangay_name'],
                'status' => 'pending'
            ];
            $notifMsg = json_encode($notifData);
            // Notify driver
            $stmtNotif = $pdo->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
            $stmtNotif->execute([$driver['user_id'], $notifMsg]);
            // Notify collectors
            foreach ($selectedCollectors as $collector) {
                $stmtNotif->execute([$collector['user_id'], $notifMsg]);
            }
            $generatedTasks[] = [
                'team_id' => $team_id,
                'driver' => $driver['full_name'] ?: $driver['username'],
                'collectors' => array_map(function($c) { return $c['full_name'] ?: $c['username']; }, $selectedCollectors),
                'truck' => $truck['plate_num'],
                'cluster' => $clusterId,
                'barangay' => $barangay['barangay_name'],
                'date' => $date,
                'time' => $time
            ];
        }

        $currentDate->add(new DateInterval('P1D'));
    }

    // I-commit ang lahat ng inserts kung walang error
    $pdo->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Tasks auto-generated successfully.',
        'generated_tasks' => $generatedTasks,
        'total_generated' => count($generatedTasks)
    ]);

} catch (Exception $e) {
    // I-roll back kung may error sa transaction
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 
