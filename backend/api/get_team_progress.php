<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

$team_id = isset($_GET['team_id']) ? (int)$_GET['team_id'] : 0;
if (!$team_id) {
  echo json_encode(['success' => false, 'message' => 'Missing team_id']);
  exit;
}

try {
  $db = (new Database())->connect();
  // Driver acceptance lives in collection_team.status
  $driverStmt = $db->prepare("SELECT status, schedule_id FROM collection_team WHERE team_id = ?");
  $driverStmt->execute([$team_id]);
  $team = $driverStmt->fetch(PDO::FETCH_ASSOC);
  if (!$team) { throw new Exception('Team not found'); }

  $driverAccepted = in_array($team['status'], ['accepted','confirmed'], true) ? 1 : 0;

  // Collectors acceptance in collection_team_member
  $colStmt = $db->prepare("SELECT response_status FROM collection_team_member WHERE team_id = ?");
  $colStmt->execute([$team_id]);
  $collectors = $colStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
  $collectorTotal = count($collectors);
  $collectorAccepted = 0;
  foreach ($collectors as $rs) {
    if (in_array($rs, ['accepted','confirmed'], true)) $collectorAccepted++;
  }

  $total = $collectorTotal + 1; // + driver
  $accepted = $collectorAccepted + $driverAccepted;
  $percent = $total > 0 ? round(($accepted / $total) * 100) : 0;

  echo json_encode([
    'success' => true,
    'team_id' => $team_id,
    'driver' => [ 'accepted' => (bool)$driverAccepted ],
    'collectors' => [ 'accepted' => $collectorAccepted, 'total' => $collectorTotal ],
    'accepted_total' => $accepted,
    'personnel_total' => $total,
    'percent' => $percent
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

