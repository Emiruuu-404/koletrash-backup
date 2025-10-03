<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';

try {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $id = isset($input['id']) ? (int)$input['id'] : 0;
  if ($id <= 0) throw new Exception('Missing id');
  $truckId = $input['truck_id'] ?? null;
  $teamId = $input['team_id'] ?? null;

  $db = (new Database())->connect();
  $sql = "UPDATE daily_route SET truck_id = :truck_id, team_id = :team_id, updated_at = NOW() WHERE id = :id";
  $stmt = $db->prepare($sql);
  $stmt->bindValue(':truck_id', $truckId !== null ? $truckId : null, $truckId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
  $stmt->bindValue(':team_id', $teamId !== null ? $teamId : null, $teamId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
  $stmt->bindValue(':id', $id, PDO::PARAM_INT);
  $stmt->execute();

  echo json_encode([ 'success' => true ]);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}
?>
















