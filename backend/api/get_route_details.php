<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

try {
  if (!isset($_GET['id'])) { throw new Exception('Missing id'); }
  $id = (int)$_GET['id'];
  $db = (new Database())->connect();

  $head = $db->prepare("SELECT dr.*, t.plate_num, ct.team_id
                         FROM daily_route dr
                         LEFT JOIN truck t ON dr.truck_id = t.truck_id
                         LEFT JOIN collection_team ct ON dr.team_id = ct.team_id
                         WHERE dr.id = ?");
  $head->execute([$id]);
  $route = $head->fetch(PDO::FETCH_ASSOC);
  if (!$route) { throw new Exception('Route not found'); }

  $stops = $db->prepare("SELECT * FROM daily_route_stop WHERE daily_route_id = ? ORDER BY seq");
  $stops->execute([$id]);
  $route['stops'] = $stops->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([ 'success' => true, 'route' => $route ]);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}
?>


