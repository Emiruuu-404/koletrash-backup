<?php
// CORS for frontend at Vite dev server (allow credentials)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowedOrigin = 'http://localhost:5173';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
header('Content-Type: application/json');

require_once '../config/database.php';
require_once '../lib/AssignmentResolver.php';

try {
  session_start();

  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([ 'success' => false, 'message' => 'Invalid JSON body' ]);
    exit;
  }

  $lat = isset($data['lat']) ? floatval($data['lat']) : null;
  $lng = isset($data['lng']) ? floatval($data['lng']) : null;
  if (!is_finite($lat) || !is_finite($lng) || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
    http_response_code(422);
    echo json_encode([ 'success' => false, 'message' => 'Invalid lat/lng' ]);
    exit;
  }
  $speed = isset($data['speed']) && is_numeric($data['speed']) ? floatval($data['speed']) : null;
  $heading = isset($data['heading']) && is_numeric($data['heading']) ? floatval($data['heading']) : null;
  $accuracy = isset($data['accuracy']) && is_numeric($data['accuracy']) ? floatval($data['accuracy']) : null;
  $battery = isset($data['battery']) && is_numeric($data['battery']) ? intval($data['battery']) : null;

  // Determine driver from session or query for testing
  $driverId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : intval($_GET['driver_id'] ?? 0);
  if ($driverId <= 0) {
    http_response_code(400);
    echo json_encode([ 'success' => false, 'message' => 'Missing driver session' ]);
    exit;
  }

  $db = (new Database())->connect();
  $resolver = new AssignmentResolver($db);
  $assignment = $resolver->resolveForDriver($driverId);
  $teamId = $assignment['team_id'] ?? null;
  $truckId = $assignment['truck_id'] ?? null;

  // Insert into gps_route_log (create table if you haven't already)
  $sql = "INSERT INTO gps_route_log (team_id, latitude, longitude, timestamp, speed, accuracy, driver_id, truck_id)
          VALUES (:team_id, :lat, :lng, NOW(), :speed, :accuracy, :driver_id, :truck_id)";
  $stmt = $db->prepare($sql);
  $stmt->execute([
    ':team_id' => $teamId,
    ':lat' => $lat,
    ':lng' => $lng,
    ':speed' => $speed,
    ':accuracy' => $accuracy,
    ':driver_id' => $driverId,
    ':truck_id' => $truckId,
  ]);

  echo json_encode([ 'success' => true, 'inserted_id' => $db->lastInsertId(), 'assignment' => $assignment ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}

?>


