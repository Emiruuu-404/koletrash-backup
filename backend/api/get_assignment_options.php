<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

try {
  $db = (new Database())->connect();

  $trucks = $db->query("SELECT truck_id, plate_num FROM truck WHERE status IN ('Available','available','ACTIVE','Active')")->fetchAll(PDO::FETCH_ASSOC);

  $teams = [];
  try {
    $teams = $db->query("SELECT team_id FROM collection_team")->fetchAll(PDO::FETCH_ASSOC);
  } catch (Throwable $e) {}

  echo json_encode([ 'success' => true, 'trucks' => $trucks, 'teams' => $teams ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}
?>
















