<?php

class AssignmentResolver {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // Resolve current truck/team for a driver (user_id)
    public function resolveForDriver(int $driverId): array {
        // 1) Try active collection_team mapping
        $sqlTeam = "SELECT team_id, truck_id FROM collection_team
                    WHERE driver_id = :driver_id
                    ORDER BY team_id DESC LIMIT 1"; // adjust if you later add an 'active' flag
        $stmt = $this->db->prepare($sqlTeam);
        $stmt->execute([':driver_id' => $driverId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && ($row['truck_id'] !== null)) {
            return [
                'driver_id' => $driverId,
                'team_id' => (int)$row['team_id'],
                'truck_id' => (int)$row['truck_id'],
                'source' => 'collection_team'
            ];
        }

        // 2) Fallback: today's daily_route entry linked via team_id
        $sqlDaily = "SELECT dr.team_id, dr.truck_id
                     FROM daily_route dr
                     WHERE dr.date = CURDATE()
                       AND dr.team_id IN (
                           SELECT team_id FROM collection_team WHERE driver_id = :driver_id
                       )
                     ORDER BY dr.updated_at DESC
                     LIMIT 1";
        $stmt = $this->db->prepare($sqlDaily);
        $stmt->execute([':driver_id' => $driverId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && ($row['truck_id'] !== null)) {
            return [
                'driver_id' => $driverId,
                'team_id' => (int)$row['team_id'],
                'truck_id' => (int)$row['truck_id'],
                'source' => 'daily_route'
            ];
        }

        return [
            'driver_id' => $driverId,
            'team_id' => null,
            'truck_id' => null,
            'source' => 'unassigned'
        ];
    }
}

?>



















