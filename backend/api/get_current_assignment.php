<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../config/database.php';
require_once '../lib/AssignmentResolver.php';

try {
  session_start();
  // If your auth sets $_SESSION['user_id'] for drivers, use it;
  // else allow a query param for testing: ?driver_id=123
  $driverId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : intval($_GET['driver_id'] ?? 0);
  if ($driverId <= 0) {
    http_response_code(400);
    echo json_encode([ 'success' => false, 'message' => 'Missing driver_id (session or query)' ]);
    exit;
  }

  $db = (new Database())->connect();
  $resolver = new AssignmentResolver($db);
  $result = $resolver->resolveForDriver($driverId);

  // Optionally include plate number
  $plate = null;
  if (!empty($result['truck_id'])) {
    $stmt = $db->prepare('SELECT plate_num FROM truck WHERE truck_id = :id');
    $stmt->execute([':id' => $result['truck_id']]);
    $plate = $stmt->fetchColumn();
  }

  echo json_encode([
    'success' => true,
    'assignment' => $result,
    'plate' => $plate,
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}

?>



















