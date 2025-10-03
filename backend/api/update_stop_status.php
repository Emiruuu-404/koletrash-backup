<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';

try {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $stopId = isset($input['stop_id']) ? (int)$input['stop_id'] : 0;
  $status = isset($input['status']) ? $input['status'] : '';
  $userId = $input['user_id'] ?? null;
  if ($stopId <= 0 || !in_array($status, ['pending','visited','skipped'])) {
    throw new Exception('Invalid stop_id or status');
  }

  $db = (new Database())->connect();
  // Update stop status
  $stmt = $db->prepare("UPDATE daily_route_stop SET status = :status, updated_at = NOW() WHERE id = :id");
  $stmt->execute([':status' => $status, ':id' => $stopId]);

  // Log task event if available
  try {
    $logUrl = __DIR__ . '/log_task_event.php';
    if (file_exists($logUrl)) {
      // Find assignment id from route head if possible
      $q = $db->prepare("SELECT dr.team_id AS assignment_id FROM daily_route_stop s JOIN daily_route dr ON s.daily_route_id = dr.id WHERE s.id = ?");
      $q->execute([$stopId]);
      $assignmentId = $q->fetchColumn();
      if ($assignmentId) {
        // Insert directly to task_events to avoid nested HTTP calls
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
        $ins = $db->prepare("INSERT INTO task_events(assignment_id,user_id,event_type,before_json,after_json) VALUES(?,?,?,?,?)");
        $ins->execute([$assignmentId, $userId, 'stop_status_updated', null, json_encode(['stop_id'=>$stopId,'status'=>$status])]);
      }
    }
  } catch (Throwable $e) { /* ignore */ }

  echo json_encode(['success' => true]);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
















