<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../config/database.php';

try {
  $since = isset($_GET['since']) ? max(30, intval($_GET['since'])) : 180; // seconds
  $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 2;

  $db = (new Database())->connect();

  // Get latest log per truck within window (unique per truck)
  $sql = "
    SELECT g.truck_id,
           tr.plate_num AS plate,
           u.username   AS driver,
           g.latitude   AS lat,
           g.longitude  AS lng,
           g.speed,
           g.accuracy,
           g.timestamp  AS ts
    FROM (
      SELECT truck_id, MAX(timestamp) AS max_ts
      FROM gps_route_log
      WHERE timestamp >= NOW() - INTERVAL :since SECOND
        AND truck_id IS NOT NULL
      GROUP BY truck_id
      ORDER BY max_ts DESC
      LIMIT :limit
    ) latest
    JOIN gps_route_log g ON g.truck_id = latest.truck_id AND g.timestamp = latest.max_ts
    JOIN truck tr ON tr.truck_id = g.truck_id
    /* Join to a single driver per truck to avoid duplicates */
    LEFT JOIN (
      SELECT truck_id, MIN(team_id) AS team_id, MIN(driver_id) AS driver_id
      FROM collection_team
      GROUP BY truck_id
    ) ct ON ct.truck_id = g.truck_id
    LEFT JOIN user u ON u.user_id = ct.driver_id
    ORDER BY g.timestamp DESC
  ";

  $stmt = $db->prepare($sql);
  $stmt->bindValue(':since', $since, PDO::PARAM_INT);
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([ 'success' => true, 'trucks' => $rows ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}

?>


