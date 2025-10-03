<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

try {
  $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
  $role = isset($_GET['role']) ? strtolower(trim($_GET['role'])) : null; // 'driver' | 'collector' | null
  $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
  $db = (new Database())->connect();

  // Base query
  $sql = "SELECT dr.*, t.plate_num, ct.team_id
          FROM daily_route dr
          LEFT JOIN truck t ON dr.truck_id = t.truck_id
          LEFT JOIN collection_team ct ON dr.team_id = ct.team_id
          WHERE dr.date = :d";

  $params = [ ':d' => $date ];

  // Apply optional acceptance filtering for personnel 'My Routes'
  // Rule: a personnel does NOT see a generated route until THEY have accepted it.
  if ($userId && ($role === 'driver' || $role === 'collector')) {
    if ($role === 'driver') {
      // Only routes for this driver AND where the driver has accepted/confirmed
      $sql .= " AND ct.driver_id = :uid AND ct.status IN ('accepted','confirmed')";
      $params[':uid'] = $userId;
    } else if ($role === 'collector') {
      // Only routes for teams where this collector is a member AND they accepted/confirmed
      $sql .= " AND EXISTS (
                  SELECT 1 FROM collection_team_member ctm
                  WHERE ctm.team_id = dr.team_id
                    AND ctm.collector_id = :uid
                    AND ctm.response_status IN ('accepted','confirmed')
                )";
      $params[':uid'] = $userId;
    }
  }

  $sql .= " ORDER BY dr.start_time";

  $stmt = $db->prepare($sql);
  $stmt->execute($params);
  $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([ 'success' => true, 'date' => $date, 'routes' => $routes ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}
?>


