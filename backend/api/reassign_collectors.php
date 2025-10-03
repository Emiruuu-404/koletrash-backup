<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';

try {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $teamId = isset($input['team_id']) ? (int)$input['team_id'] : 0;
  $mode = $input['mode'] ?? 'fill_missing'; // 'replace_declined' | 'fill_missing'
  $applyAllForDate = isset($input['apply_to_all_for_date']) ? (bool)$input['apply_to_all_for_date'] : false;
  $declinedCollectorId = isset($input['declined_collector_id']) ? (int)$input['declined_collector_id'] : 0;

  if (!$teamId) {
    echo json_encode(['success' => false, 'message' => 'Missing team_id']);
    exit;
  }

  $db = (new Database())->connect();
  $db->beginTransaction();

  // Helper to process a single team
  $processTeam = function($db, $teamRow, $mode) {
    $teamId = (int)$teamRow['team_id'];
    $date = $teamRow['scheduled_date'];

  // Determine which collectors need replacement
  if ($mode === 'replace_declined') {
    $declinedStmt = $db->prepare("SELECT collector_id FROM collection_team_member WHERE team_id = ? AND response_status = 'declined'");
    $declinedStmt->execute([$teamId]);
    $toReplace = $declinedStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
  } else { // fill_missing
    $toReplace = [];
    $missingStmt = $db->prepare("SELECT collector_id FROM collection_team_member WHERE team_id = ?");
    $missingStmt->execute([$teamId]);
    $existing = $missingStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
  }

  // Log current team status before reassignment
  $beforeStatus = $db->prepare("SELECT response_status, collector_id FROM collection_team_member WHERE team_id = ?");
  $beforeStatus->execute([$teamId]);
  $beforeMembers = $beforeStatus->fetchAll(PDO::FETCH_ASSOC);

  // Helper: find one available collector not already booked on this date and not in this team
  $findCollector = function() use ($db, $teamId, $date) {
    $q = $db->prepare("SELECT u.user_id
                       FROM user u
                       LEFT JOIN user_profile up ON up.user_id = u.user_id
                       WHERE u.role_id = 4
                         AND (up.status IN ('active','online') OR up.status IS NULL)
                         AND u.user_id NOT IN (
                           SELECT ctm.collector_id FROM collection_team_member ctm WHERE ctm.team_id = :tid
                         )
                         AND u.user_id NOT IN (
                           SELECT ctm2.collector_id FROM collection_team_member ctm2
                           JOIN collection_team ct2 ON ct2.team_id = ctm2.team_id
                           JOIN collection_schedule cs2 ON cs2.schedule_id = ct2.schedule_id
                           WHERE cs2.scheduled_date = :d
                         )
                       LIMIT 1");
    $q->execute([':tid' => $teamId, ':d' => $date]);
    return $q->fetchColumn();
  };

    $reassigned = [];

  if ($mode === 'replace_declined') {
    foreach ($toReplace as $declinedId) {
      $newId = $findCollector();
      if ($newId) {
        // Replace the declined collector with new one
        $stmt = $db->prepare("UPDATE collection_team_member SET collector_id = ?, response_status = 'pending' WHERE team_id = ? AND collector_id = ?");
        $stmt->execute([$newId, $teamId, $declinedId]);
        $reassigned[] = (int)$newId;
      }
    }
  } else {
    // Fill up to 3 collectors per team as a baseline
    $countStmt = $db->prepare("SELECT COUNT(*) FROM collection_team_member WHERE team_id = ?");
    $countStmt->execute([$teamId]);
    $have = (int)$countStmt->fetchColumn();
    while ($have < 3) {
      $newId = $findCollector();
      if (!$newId) break;
      $stmt = $db->prepare("INSERT INTO collection_team_member (team_id, collector_id, response_status) VALUES (?, ?, 'pending')");
      $stmt->execute([$teamId, $newId]);
      $reassigned[] = (int)$newId;
      $have++;
    }
  }

    // Only reset team status if there are still pending members after reassignment
    if (!empty($reassigned)) {
      // Check if all team members are now accepted/confirmed
      $statusCheck = $db->prepare("SELECT COUNT(*) as total, 
                                   SUM(CASE WHEN response_status IN ('accepted', 'confirmed') THEN 1 ELSE 0 END) as accepted_count,
                                   SUM(CASE WHEN response_status = 'declined' THEN 1 ELSE 0 END) as declined_count
                                   FROM collection_team_member WHERE team_id = ?");
      $statusCheck->execute([$teamId]);
      $status = $statusCheck->fetch(PDO::FETCH_ASSOC);
      
      // Only set to pending if there are still members who haven't accepted
      // AND if there are still declined members (meaning we need to wait for new acceptances)
      if ($status['accepted_count'] < $status['total'] && $status['declined_count'] > 0) {
      $db->prepare("UPDATE collection_team SET status = 'pending' WHERE team_id = ?")->execute([$teamId]);
      }

      // Notify each reassigned collector with a daily_assignments message
      $notifStmt = $db->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
      foreach ($reassigned as $uid) {
        $payload = [
          'type' => 'daily_assignments',
          'date' => $date,
          'assignments' => [ [ 'team_id' => $teamId, 'date' => $date, 'time' => $teamRow['start_time'], 'type' => 'reassigned' ] ]
        ];
        $notifStmt->execute([$uid, json_encode($payload)]);
      }
    }

    return $reassigned;
  };

  // Load team + schedule context (single)
  $stmt = $db->prepare("SELECT ct.team_id, ct.schedule_id, cs.scheduled_date, cs.start_time
                        FROM collection_team ct
                        JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                        WHERE ct.team_id = ?");
  $stmt->execute([$teamId]);
  $team = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$team) { throw new Exception('Team not found'); }

  $date = $team['scheduled_date'];

  $allReassigned = [];
  $toppedUpTotal = 0;

  if ($applyAllForDate && $declinedCollectorId) {
    // Special case: replace this specific collector across all teams on this date with ONE replacement
    // Find a single replacement (active/online) different from declined user; allow re-use across teams for this date
    $findOne = $db->prepare("SELECT u.user_id
                             FROM user u
                             LEFT JOIN user_profile up ON up.user_id = u.user_id
                             WHERE u.role_id = 4 AND u.user_id <> :curr
                               AND (up.status IN ('active','online') OR up.status IS NULL)
                             LIMIT 1");
    $findOne->execute([':curr' => $declinedCollectorId]);
    $replacementId = (int)$findOne->fetchColumn();

    if ($replacementId) {
      // All teams on the date where the declined collector is present
      $q = $db->prepare("SELECT ct.team_id, cs.scheduled_date, cs.start_time
                         FROM collection_team ct
                         JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                         JOIN collection_team_member ctm ON ctm.team_id = ct.team_id
                         WHERE cs.scheduled_date = ? AND ctm.collector_id = ?");
      $q->execute([$date, $declinedCollectorId]);
      // Batched notifications per recipient
      $batchedByUser = [];
      while ($row = $q->fetch(PDO::FETCH_ASSOC)) {
        $tid = (int)$row['team_id'];
        // Prevent duplicate member in the same team
        $exists = $db->prepare("SELECT 1 FROM collection_team_member WHERE team_id = ? AND collector_id = ? LIMIT 1");
        $exists->execute([$tid, $replacementId]);
        if ($exists->fetchColumn()) {
          // Replacement already in team. Find an alternative available collector for this team/date
          $altFinder = $db->prepare("SELECT u.user_id
                                     FROM user u
                                     LEFT JOIN user_profile up ON up.user_id = u.user_id
                                     WHERE u.role_id = 4
                                       AND u.user_id <> :declined
                                       AND (up.status IN ('active','online') OR up.status IS NULL)
                                       AND u.user_id NOT IN (
                                         SELECT ctm.collector_id FROM collection_team_member ctm WHERE ctm.team_id = :tid
                                       )
                                       AND u.user_id NOT IN (
                                         SELECT ctm2.collector_id FROM collection_team_member ctm2
                                         JOIN collection_team ct2 ON ct2.team_id = ctm2.team_id
                                         JOIN collection_schedule cs2 ON cs2.schedule_id = ct2.schedule_id
                                         WHERE cs2.scheduled_date = :d
                                       )
                                     LIMIT 1");
          $altFinder->execute([':declined' => $declinedCollectorId, ':tid' => $tid, ':d' => $date]);
          $altId = (int)$altFinder->fetchColumn();

          if ($altId) {
            // Replace declined with alternative collector
            $db->prepare("UPDATE collection_team_member SET collector_id = ?, response_status = 'pending' WHERE team_id = ? AND collector_id = ?")
               ->execute([$altId, $tid, $declinedCollectorId]);
            $replForTeam = $altId;
          } else {
            // No alternative found; keep the declined member to avoid shrinking the team
            $replForTeam = 0;
          }
        } else {
          // Replace the declined collector with the replacement
          $db->prepare("UPDATE collection_team_member SET collector_id = ?, response_status = 'pending' WHERE team_id = ? AND collector_id = ?")
             ->execute([$replacementId, $tid, $declinedCollectorId]);
          $replForTeam = $replacementId;
        }
        // Attempt to top-up to 3 collectors if the team currently has fewer than 3
        $countStmt = $db->prepare("SELECT COUNT(*) FROM collection_team_member WHERE team_id = ?");
        $countStmt->execute([$tid]);
        $haveNow = (int)$countStmt->fetchColumn();
        while ($haveNow < 3) {
          $findExtra = $db->prepare("SELECT u.user_id
                                     FROM user u
                                     LEFT JOIN user_profile up ON up.user_id = u.user_id
                                     WHERE u.role_id = 4
                                       AND (up.status IN ('active','online') OR up.status IS NULL)
                                       AND u.user_id NOT IN (
                                         SELECT ctm.collector_id FROM collection_team_member ctm WHERE ctm.team_id = :tid
                                       )
                                       AND u.user_id NOT IN (
                                         SELECT ctm2.collector_id FROM collection_team_member ctm2
                                         JOIN collection_team ct2 ON ct2.team_id = ctm2.team_id
                                         JOIN collection_schedule cs2 ON cs2.schedule_id = ct2.schedule_id
                                         WHERE cs2.scheduled_date = :d
                                       )
                                     LIMIT 1");
          $findExtra->execute([':tid' => $tid, ':d' => $date]);
          $extraId = (int)$findExtra->fetchColumn();
          if (!$extraId) break;
          $db->prepare("INSERT INTO collection_team_member (team_id, collector_id, response_status) VALUES (?, ?, 'pending')")
             ->execute([$tid, $extraId]);
          $haveNow++;
          $toppedUpTotal++;
        }

        // Only set team to pending if there are still pending members
        $statusCheck = $db->prepare("SELECT COUNT(*) as total, 
                                     SUM(CASE WHEN response_status IN ('accepted', 'confirmed') THEN 1 ELSE 0 END) as accepted_count,
                                     SUM(CASE WHEN response_status = 'declined' THEN 1 ELSE 0 END) as declined_count
                                     FROM collection_team_member WHERE team_id = ?");
        $statusCheck->execute([$tid]);
        $status = $statusCheck->fetch(PDO::FETCH_ASSOC);
        
        // Only set to pending if there are still members who haven't accepted
        // AND if there are still declined members (meaning we need to wait for new acceptances)
        if ($status['accepted_count'] < $status['total'] && $status['declined_count'] > 0) {
        $db->prepare("UPDATE collection_team SET status = 'pending' WHERE team_id = ?")
           ->execute([$tid]);
        }

        // Queue the assignment for batched notification (per recipient)
        if (!empty($replForTeam)) {
          if (!isset($batchedByUser[$replForTeam])) $batchedByUser[$replForTeam] = [];
          $batchedByUser[$replForTeam][] = [ 'team_id' => $tid, 'date' => $date, 'time' => $row['start_time'], 'type' => 'reassigned' ];
          $allReassigned[] = $replForTeam;
        }
      }
      // Send ONE notification per recipient
      if (!empty($batchedByUser)) {
        $notifStmt = $db->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
        foreach ($batchedByUser as $recipientId => $assignmentsList) {
          $payload = [ 'type' => 'daily_assignments', 'date' => $date, 'assignments' => $assignmentsList ];
          $notifStmt->execute([$recipientId, json_encode($payload)]);
        }
      }
    }
  } elseif ($applyAllForDate) {
    // Generic per-team processing for the date
    $q = $db->prepare("SELECT ct.team_id, cs.scheduled_date, cs.start_time
                       FROM collection_team ct
                       JOIN collection_schedule cs ON cs.schedule_id = ct.schedule_id
                       WHERE cs.scheduled_date = ?");
    $q->execute([$date]);
    while ($row = $q->fetch(PDO::FETCH_ASSOC)) {
      $r = $processTeam($db, $row, $mode);
      $allReassigned = array_merge($allReassigned, $r);
    }
  } else {
    $allReassigned = $processTeam($db, $team, $mode);
  }

  $db->commit();
  echo json_encode(['success' => true, 'reassigned' => $allReassigned, 'count' => count($allReassigned), 'topped_up' => $toppedUpTotal, 'date' => $date, 'applied_to_all' => $applyAllForDate]);
} catch (Throwable $e) {
  if (isset($db) && $db->inTransaction()) $db->rollBack();
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


