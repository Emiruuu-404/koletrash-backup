<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';

try {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $routeId = isset($input['route_id']) ? (int)$input['route_id'] : 0;
  $status = isset($input['status']) ? trim($input['status']) : '';
  $userId = $input['user_id'] ?? null; // optional
  $note = isset($input['note']) ? trim($input['note']) : null; // optional free-text
  $truckFull = isset($input['truck_full']) ? (bool)$input['truck_full'] : false;

  $allowed = ['pending','in_progress','completed','paused'];
  if ($routeId <= 0 || ($status !== '' && !in_array($status, $allowed))) {
    throw new Exception('Invalid route_id or status');
  }

  $db = (new Database())->connect();

  // Read current state + context
  $curStmt = $db->prepare('SELECT status, team_id, barangay_id, barangay_name FROM daily_route WHERE id = ?');
  $curStmt->execute([$routeId]);
  $current = $curStmt->fetch(PDO::FETCH_ASSOC);
  if (!$current) { throw new Exception('Route not found'); }

  $before = ['status' => $current['status']];

  if ($status !== '') {
    $upd = $db->prepare('UPDATE daily_route SET status = ?, updated_at = NOW() WHERE id = ?');
    $upd->execute([$status, $routeId]);
  }

  // Ensure task_events table exists
  $db->exec("CREATE TABLE IF NOT EXISTS task_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    user_id VARCHAR(50) NULL,
    event_type VARCHAR(64) NOT NULL,
    before_json JSON NULL,
    after_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_assignment (assignment_id),
    INDEX idx_event_type (event_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $assignmentId = $current['team_id'];
  $ins = $db->prepare('INSERT INTO task_events(assignment_id,user_id,event_type,before_json,after_json) VALUES(?,?,?,?,?)');

  if ($status !== '') {
    $ins->execute([$assignmentId, $userId, 'route_status_updated', json_encode($before), json_encode(['route_id'=>$routeId,'status'=>$status,'note'=>$note])]);
  }

  if ($truckFull) {
    $ins->execute([$assignmentId, $userId, 'truck_full', null, json_encode(['route_id'=>$routeId,'note'=>$note])]);

    // Notify residents and barangay head of the barangay for this route
    try {
      $barangayId = $current['barangay_id'] ?? null;
      $barangayName = $current['barangay_name'] ?? null;
      if ($barangayId) {
        // Find resident users in the barangay
        $sql = "SELECT u.user_id\n                FROM user u\n                LEFT JOIN user_profile up ON up.user_id = u.user_id\n                LEFT JOIN role r ON r.role_id = u.role_id\n                WHERE up.barangay_id = :bid AND (r.role_name = 'resident' OR r.role_name IS NULL)";
        $resStmt = $db->prepare($sql);
        $resStmt->execute([':bid' => $barangayId]);
        $residentIds = $resStmt->fetchAll(PDO::FETCH_COLUMN);

        // Find barangay head for this barangay
        $bhSql = "SELECT u.user_id\n                  FROM user u\n                  LEFT JOIN user_profile up ON up.user_id = u.user_id\n                  LEFT JOIN role r ON r.role_id = u.role_id\n                  WHERE up.barangay_id = :bid AND r.role_name = 'barangay_head'";
        $bhStmt = $db->prepare($bhSql);
        $bhStmt->execute([':bid' => $barangayId]);
        $barangayHeadIds = $bhStmt->fetchAll(PDO::FETCH_COLUMN);

        // Combine all recipients
        $allRecipients = array_merge($residentIds, $barangayHeadIds);

        if (!empty($allRecipients)) {
          $notifStmt = $db->prepare("INSERT INTO notification (recipient_id, message, created_at, response_status) VALUES (?, ?, NOW(), 'unread')");
          $payloadBase = [
            'type' => 'truck_full_alert',
            'route_id' => $routeId,
            'team_id' => $assignmentId,
            'barangay_id' => $barangayId,
            'barangay_name' => $barangayName,
            'note' => $note,
          ];
          foreach ($allRecipients as $rid) {
            $notifStmt->execute([$rid, json_encode($payloadBase)]);
          }
        }
      }
    } catch (Throwable $e) {
      // Soft-fail notification sending to not block the main status update
    }
  }

  echo json_encode(['success' => true]);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>







