<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
$database = new Database();
$conn = $database->connect();
header('Content-Type: application/json');

$raw = file_get_contents("php://input");
if (empty($raw)) {
    echo json_encode(['success' => false, 'message' => 'Empty request body']);
    exit;
}
$data = json_decode($raw, true);
if ($data === null) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Validate required fields
// Support bulk acceptance for a date: payload may have { date, user_id, response_status, role }
if (isset($data['date']) && isset($data['user_id']) && isset($data['response_status']) && isset($data['role'])) {
    $bulkDate = $data['date'];
    $user_id = $data['user_id'];
    $response_status = $data['response_status'];
    $role = $data['role'];

    try {
        $conn->beginTransaction();

        // Find all team assignments for the user on that date
        if ($role === 'driver') {
            $stmt = $conn->prepare("SELECT ct.team_id
                                    FROM collection_team ct
                                    JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                                    WHERE ct.driver_id = ? AND cs.scheduled_date = ?");
            $stmt->execute([$user_id, $bulkDate]);
            $teamIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($teamIds)) {
                // Update driver acceptance
                $in = implode(',', array_fill(0, count($teamIds), '?'));
                $params = array_merge([$response_status], $teamIds);
                $conn->prepare("UPDATE collection_team SET status = ? WHERE team_id IN ($in)")->execute($params);
            }
        } else if ($role === 'collector') {
            $stmt = $conn->prepare("SELECT ctm.team_id
                                    FROM collection_team_member ctm
                                    JOIN collection_team ct ON ct.team_id = ctm.team_id
                                    JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                                    WHERE ctm.collector_id = ? AND cs.scheduled_date = ?");
            $stmt->execute([$user_id, $bulkDate]);
            $teamIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($teamIds)) {
                $in = implode(',', array_fill(0, count($teamIds), '?'));
                $params = array_merge([$response_status, $user_id], $teamIds);
                $conn->prepare("UPDATE collection_team_member SET response_status = ? WHERE collector_id = ? AND team_id IN ($in)")->execute($params);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid role']);
            exit;
        }

        // For each team, if everyone accepted, flip statuses
        if (!empty($teamIds)) {
            foreach ($teamIds as $tid) {
                // Check all accepted
                $stmt = $conn->prepare("SELECT ct.status AS driver_status,
                                                SUM(CASE WHEN ctm.response_status IN ('accepted','confirmed') THEN 1 ELSE 0 END) AS acc,
                                                COUNT(*) AS total
                                         FROM collection_team ct
                                         JOIN collection_team_member ctm ON ctm.team_id = ct.team_id
                                         WHERE ct.team_id = ?");
                $stmt->execute([$tid]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $driverAccepted = in_array($row['driver_status'], ['accepted','confirmed'], true);
                if ($driverAccepted && $row['total'] > 0 && (int)$row['acc'] === (int)$row['total']) {
                    $conn->prepare("UPDATE collection_team SET status = 'accepted' WHERE team_id = ?")->execute([$tid]);
                    $conn->prepare("UPDATE collection_schedule SET status = 'scheduled' WHERE schedule_id = (SELECT schedule_id FROM collection_team WHERE team_id = ?)")->execute([$tid]);
                }
            }
        }

        // Update notification status to 'read' for bulk daily assignments
        $stmt = $conn->prepare("UPDATE notification SET response_status = 'read' 
                               WHERE recipient_id = ? 
                               AND message LIKE ?");
        $datePattern = '%"date":"' . $bulkDate . '"%';
        $stmt->execute([$user_id, $datePattern]);

        $conn->commit();
        echo json_encode(['success' => true, 'bulk' => true, 'updated_teams' => count($teamIds ?? [])]);
        exit;
    } catch (Exception $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}

if (!isset($data['assignment_id'], $data['user_id'], $data['response_status'], $data['role'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$team_id = $data['assignment_id'];
$user_id = $data['user_id'];
$response_status = $data['response_status'];
$role = $data['role'];

try {
    $conn->beginTransaction();

    // Update assignment status based on role
    if ($role === 'collector') {
        $sql = "UPDATE collection_team_member SET response_status = :response_status WHERE team_id = :team_id AND collector_id = :collector_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':response_status', $response_status);
        $stmt->bindParam(':team_id', $team_id, PDO::PARAM_INT);
        $stmt->bindParam(':collector_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
    } else if ($role === 'driver') {
        // For driver, update the collection_team.status field
        $sql = "UPDATE collection_team SET status = :response_status WHERE team_id = :team_id AND driver_id = :driver_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':response_status', $response_status);
        $stmt->bindParam(':team_id', $team_id, PDO::PARAM_INT);
        $stmt->bindParam(':driver_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid role']);
        exit;
    }

    // Check if all personnel have accepted the assignment
    $allAccepted = false;
    
    // Get team details
    $stmt = $conn->prepare("
        SELECT ct.*, cs.scheduled_date, cs.start_time, b.barangay_name 
        FROM collection_team ct 
        LEFT JOIN collection_schedule cs ON ct.schedule_id = cs.schedule_id 
        LEFT JOIN barangay b ON cs.barangay_id = b.barangay_id 
        WHERE ct.team_id = ?
    ");
    $stmt->execute([$team_id]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($team) {
        // Check if driver has accepted (from collection_team.status)
        $driverAccepted = ($team['status'] === 'accepted' || $team['status'] === 'confirmed');
        
        // Check if all collectors have accepted (from collection_team_member)
        $stmt = $conn->prepare("
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN response_status IN ('accepted', 'confirmed') THEN 1 ELSE 0 END) as accepted 
            FROM collection_team_member 
            WHERE team_id = ?
        ");
        $stmt->execute([$team_id]);
        $collectorStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $allCollectorsAccepted = ($collectorStats['total'] > 0 && $collectorStats['total'] == $collectorStats['accepted']);
        
        // All personnel have accepted if driver AND all collectors accepted
        $allAccepted = $driverAccepted && $allCollectorsAccepted;
    }

    // If all personnel have accepted, update team status to 'accepted'
    if ($allAccepted) {
        $stmt = $conn->prepare("UPDATE collection_team SET status = 'accepted' WHERE team_id = ?");
        $stmt->execute([$team_id]);
        
        // Also update the collection_schedule status from 'pending' to 'scheduled'
        $stmt = $conn->prepare("UPDATE collection_schedule SET status = 'scheduled' WHERE schedule_id = ?");
        $stmt->execute([$team['schedule_id']]);
    }

    // Update notification status to 'read' for this user's notifications related to this team
    $stmt = $conn->prepare("UPDATE notification SET response_status = 'read' 
                           WHERE recipient_id = ? 
                           AND (message LIKE ? OR message LIKE ?)");
    $teamIdPattern = '%"team_id":"' . $team_id . '"%';
    $assignmentIdPattern = '%"assignment_id":"' . $team_id . '"%';
    $stmt->execute([$user_id, $teamIdPattern, $assignmentIdPattern]);

    // Auto-reassign on decline: if current response was 'declined', try to find a replacement and notify
    if ($response_status === 'declined' && $team) {
        // Bring schedule context
        $date = $team['scheduled_date'];
        $startTime = $team['start_time'];
        $barangayName = $team['barangay_name'];

        // Helper to insert a single daily_assignments notification
        $notifyDaily = function($recipientId) use ($conn, $date, $barangayName, $startTime) {
            $payload = [
                'type' => 'daily_assignments',
                'date' => $date,
                'assignments' => [ [
                    'team_id' => null, // team_id optional here
                    'barangay' => $barangayName,
                    'cluster' => null,
                    'date' => $date,
                    'time' => $startTime,
                    'type' => 'reassigned'
                ]]
            ];
            $stmtN = $conn->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
            $stmtN->execute([$recipientId, json_encode($payload)]);
        };

        if ($role === 'driver') {
            // Find next available driver (role_id=3) not already assigned that date
            $sql = "SELECT u.user_id
                    FROM user u
                    LEFT JOIN user_profile up ON up.user_id = u.user_id
                    WHERE u.role_id = 3 AND u.user_id <> :curr
                      AND (up.status IN ('active','online') OR up.status IS NULL)
                      AND u.user_id NOT IN (
                        SELECT ct.driver_id FROM collection_team ct
                        JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                        WHERE cs.scheduled_date = :d
                      )
                    LIMIT 1";
            $stmtR = $conn->prepare($sql);
            $stmtR->execute([':curr' => $user_id, ':d' => $date]);
            $newDriverId = $stmtR->fetchColumn();
            if ($newDriverId) {
                $conn->prepare("UPDATE collection_team SET driver_id = ?, status = 'pending' WHERE team_id = ?")
                     ->execute([$newDriverId, $team_id]);
                // Notify the replacement driver
                $notifyDaily((int)$newDriverId);
            }
        } elseif ($role === 'collector') {
            // Find ONE replacement collector (role_id=4), active/online, and not the declining user.
            // Note: Allow assigning the same replacement across multiple teams on the same date.
            $findSql = "SELECT u.user_id
                        FROM user u
                        LEFT JOIN user_profile up ON up.user_id = u.user_id
                        WHERE u.role_id = 4 AND u.user_id <> :curr
                          AND (up.status IN ('active','online') OR up.status IS NULL)
                          AND u.user_id NOT IN (
                            SELECT ctm2.collector_id FROM collection_team_member ctm2
                            WHERE ctm2.team_id = :tid
                          )
                        LIMIT 1";
            $stmtR = $conn->prepare($findSql);
            $stmtR->execute([':curr' => $user_id, ':tid' => $team_id]);
            $newCollectorId = $stmtR->fetchColumn();

            if ($newCollectorId) {
                // Find all teams on this date where the declining collector is assigned
                $teamsStmt = $conn->prepare("SELECT ct.team_id, cs.start_time
                                            FROM collection_team ct
                                            JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                                            JOIN collection_team_member ctm ON ctm.team_id = ct.team_id
                                            WHERE cs.scheduled_date = ? AND ctm.collector_id = ?");
                $teamsStmt->execute([$date, $user_id]);
                $teamsToReplace = $teamsStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($teamsToReplace as $trow) {
                    $tid = (int)$trow['team_id'];
                    // Replace the declining collector in each team for that date
                    $conn->prepare("UPDATE collection_team_member SET collector_id = ?, response_status = 'pending' WHERE team_id = ? AND collector_id = ?")
                         ->execute([$newCollectorId, $tid, $user_id]);
                    // Set team back to pending
                    $conn->prepare("UPDATE collection_team SET status = 'pending' WHERE team_id = ?")
                         ->execute([$tid]);
                    // Notify the replacement for each team
                    $payload = [
                        'type' => 'daily_assignments',
                        'date' => $date,
                        'assignments' => [ [
                            'team_id' => $tid,
                            'barangay' => $barangayName,
                            'cluster' => null,
                            'date' => $date,
                            'time' => $trow['start_time'],
                            'type' => 'reassigned'
                        ]]
                    ];
                    $stmtN = $conn->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
                    $stmtN->execute([(int)$newCollectorId, json_encode($payload)]);
                }
            }
        }
    }

    $conn->commit();
    echo json_encode(['success' => true, 'all_accepted' => $allAccepted]);
    
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$stmt = null;
$conn = null;
?> 
