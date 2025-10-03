<?php

require_once __DIR__ . '/../config/database.php';

function generateDailyRoutes(PDO $db, string $date, string $policy = 'preserve_manual', string $scope = 'all', $scopeId = null): array {
  $db->beginTransaction();
  try {
    // Audit start
    $runStmt = $db->prepare("INSERT INTO route_generation_run(date,status,policy,scope,scope_id,summary) VALUES(?, 'pending', ?, ?, ?, 'starting')");
    $runStmt->execute([$date, $policy, $scope, $scopeId]);
    $runId = $db->lastInsertId();

    // Gather schedules for the date
    $schedulesSql = "SELECT cs.schedule_id, cs.barangay_id, cs.scheduled_date, cs.start_time, cs.end_time,
                            b.barangay_name, b.cluster_id
                      FROM collection_schedule cs
                      INNER JOIN barangay b ON cs.barangay_id = b.barangay_id
                      WHERE cs.status IN ('scheduled','pending') AND cs.scheduled_date = :dt";
    $schedulesStmt = $db->prepare($schedulesSql);
    $schedulesStmt->execute([':dt' => $date]);
    $schedules = $schedulesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fallback: use predefined_schedules for day-of-week if no explicit schedules
    if (empty($schedules)) {
      $dow = date('l', strtotime($date)); // e.g., Monday
      try {
        $prefSql = "SELECT ps.barangay_id, ps.barangay_name, ps.cluster_id, ps.start_time, ps.end_time
                    FROM predefined_schedules ps
                    WHERE ps.is_active = 1 AND ps.day_of_week = :dow";
        $prefStmt = $db->prepare($prefSql);
        $prefStmt->execute([':dow' => $dow]);
        $rows = $prefStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
          $schedules[] = [
            'schedule_id' => null,
            'barangay_id' => $r['barangay_id'],
            'scheduled_date' => $date,
            'start_time' => $r['start_time'],
            'end_time' => $r['end_time'],
            'barangay_name' => $r['barangay_name'],
            'cluster_id' => $r['cluster_id']
          ];
        }
      } catch (Throwable $e) {
        // ignore if table not present
      }
    }

    // Trucks and teams (basic round-robin). Only use existing columns.
    $trucks = $db->query("SELECT truck_id, plate_num FROM truck WHERE status='Available'")->fetchAll(PDO::FETCH_ASSOC);
    // collection_team may or may not have a status/name; select id only to be safe
    try {
      $teams = $db->query("SELECT team_id FROM collection_team")->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
      $teams = [];
    }
    $truckCount = max(count($trucks), 1);
    $teamCount = max(count($teams), 1);

    $createdRoutes = 0; $createdStops = 0;

    foreach ($schedules as $i => $sched) {
      if ($scope === 'cluster' && $scopeId && $sched['cluster_id'] != $scopeId) continue;

      // Pull collection points for barangay
      $ptsStmt = $db->prepare("SELECT 
                                  cp.point_id AS cp_any_id,
                                  cp.location_name,
                                  cp.latitude,
                                  cp.longitude
                                FROM collection_point cp
                                WHERE cp.barangay_id = ?");
      $ptsStmt->execute([$sched['barangay_id']]);
      $points = $ptsStmt->fetchAll(PDO::FETCH_ASSOC);
      if (empty($points)) continue;

      // Choose truck/team - prefer Task Management assignments tied to this schedule
      $truck = null; $team = null;
      try {
        if (!empty($sched['schedule_id'])) {
          $asStmt = $db->prepare("SELECT truck_id, team_id FROM collection_team WHERE schedule_id = ? LIMIT 1");
          $asStmt->execute([$sched['schedule_id']]);
          $as = $asStmt->fetch(PDO::FETCH_ASSOC);
          if ($as) {
            $truck = ['truck_id' => $as['truck_id']];
            $team = ['team_id' => $as['team_id']];
          }
        }
      } catch (Throwable $e) { /* ignore */ }
      // Fallback: round-robin when no explicit assignment exists
      if ($truck === null) { $truck = $trucks[$i % $truckCount] ?? null; }
      if ($team === null) { $team = $teams[$i % $teamCount] ?? null; }

      if ($policy === 'overwrite_generated') {
        $cancelStmt = $db->prepare("UPDATE daily_route SET status='cancelled' WHERE date=? AND cluster_id=? AND source='generated' AND status='scheduled'");
        $cancelStmt->execute([$date, $sched['cluster_id']]);
      }

      // Determine next version
      $verStmt = $db->prepare("SELECT COALESCE(MAX(version),0) FROM daily_route WHERE date=? AND cluster_id=?");
      $verStmt->execute([$date, $sched['cluster_id']]);
      $nextVersion = ((int)$verStmt->fetchColumn()) + 1;

      // Insert route header
      $routeStmt = $db->prepare("INSERT INTO daily_route(date, cluster_id, barangay_id, barangay_name, truck_id, team_id, start_time, end_time, status, source, version)
                                 VALUES(?,?,?,?,?,?,?,?, 'scheduled','generated',?)");
      $routeStmt->execute([
        $date,
        $sched['cluster_id'],
        $sched['barangay_id'],
        $sched['barangay_name'],
        $truck['truck_id'] ?? null,
        $team['team_id'] ?? null,
        $sched['start_time'],
        $sched['end_time'],
        $nextVersion
      ]);
      $routeId = $db->lastInsertId();
      $createdRoutes++;

      // Insert stops with sequential order
      $seq = 1;
      foreach ($points as $pt) {
        $stopStmt = $db->prepare("INSERT INTO daily_route_stop(daily_route_id, seq, collection_point_id, name, lat, lng)
                                  VALUES(?,?,?,?,?,?)");
        $stopStmt->execute([
          $routeId,
          $seq++,
          ($pt['cp_any_id'] ?? null),
          $pt['location_name'] ?? 'Point',
          $pt['latitude'] !== null ? (float)$pt['latitude'] : null,
          $pt['longitude'] !== null ? (float)$pt['longitude'] : null
        ]);
        $createdStops++;
      }
    }

    $summary = "Generated {$createdRoutes} routes, {$createdStops} stops";
    $upd = $db->prepare("UPDATE route_generation_run SET status='success', summary=? WHERE id=?");
    $upd->execute([$summary, $runId]);

    $db->commit();
    return ['run_id' => $runId, 'summary' => $summary, 'createdRoutes' => $createdRoutes, 'createdStops' => $createdStops];
  } catch (Throwable $e) {
    $db->rollBack();
    throw $e;
  }
}

?>


