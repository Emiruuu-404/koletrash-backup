<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';
require_once '../lib/RouteGenerator.php';

try {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $date = $input['date'] ?? date('Y-m-d');
  $policy = $input['policy'] ?? 'preserve_manual';
  $scope = $input['scope'] ?? 'all';
  $scopeId = $input['scopeId'] ?? null;

  $db = (new Database())->connect();
  $res = generateDailyRoutes($db, $date, $policy, $scope, $scopeId);
  echo json_encode([ 'success' => true, 'message' => $res['summary'], 'run_id' => $res['run_id'] ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}
?>


