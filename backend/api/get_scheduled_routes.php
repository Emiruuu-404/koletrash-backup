<?php
/**
 * Get Scheduled Routes API
 * 
 * This API fetches scheduled collection routes and integrates with:
 * - collection_schedule: Main schedule data
 * - barangay: Barangay information and cluster data
 * - collection_point: Specific location names and coordinates
 * - user/user_profile: Driver information
 * - truck: Available truck data
 * 
 * Route names now include actual location names from collection_point table
 * for more accurate and meaningful route identification.
 */
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
$database = new Database();
$db = $database->connect();

try {
    // Get date parameter from query string, default to today
    $selectedDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    // Fetch only scheduled collection schedules for the selected date
    // Since collection_team table doesn't exist yet, we'll use the existing structure
    $query = "SELECT 
                cs.schedule_id,
                cs.barangay_id,
                cs.scheduled_date,
                cs.start_time,
                cs.end_time,
                cs.status,
                b.barangay_name,
                b.cluster_id,
                cp.location_name,
                cp.latitude,
                cp.longitude
              FROM collection_schedule cs
              INNER JOIN barangay b ON cs.barangay_id = b.barangay_id
              LEFT JOIN collection_point cp ON b.barangay_id = cp.barangay_id
              WHERE cs.status = 'scheduled' 
              AND cs.scheduled_date = :selected_date
              ORDER BY cs.start_time ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':selected_date', $selectedDate);
    $stmt->execute();
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get available trucks - using correct column names from your truck table
    $truckQuery = "SELECT truck_id, plate_num, truck_type FROM truck WHERE status = 'Available'";
    $truckStmt = $db->prepare($truckQuery);
    $truckStmt->execute();
    $trucks = $truckStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get available truck drivers - using correct table structure
    $driverQuery = "SELECT u.user_id, up.firstname, up.lastname, up.contact_num 
                    FROM user u 
                    INNER JOIN user_profile up ON u.user_id = up.user_id 
                    WHERE u.role_id = 3";
    $driverStmt = $db->prepare($driverQuery);
    $driverStmt->execute();
    $drivers = $driverStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data for the frontend
    $formattedRoutes = [];
    foreach ($schedules as $index => $schedule) {
        // Generate a route name based on cluster, barangay, and location name
        $zoneNumber = substr($schedule['cluster_id'], 0, 1);
        $locationName = $schedule['location_name'] ? $schedule['location_name'] : 'Main Area';
        $routeName = "Zone {$zoneNumber} - " . ucwords(strtolower($schedule['barangay_name'])) . " - " . $locationName;
        
        // Assign truck from available trucks (round-robin assignment)
        $truckIndex = $index % count($trucks);
        $truck = $trucks[$truckIndex] ? $trucks[$truckIndex]['plate_num'] : "Truck-" . ($index + 1);
        
        // Assign driver from available drivers (round-robin assignment)
        $driverIndex = count($drivers) > 0 ? ($index % count($drivers)) : 0;
        $driver = count($drivers) > 0 ? 
            $drivers[$driverIndex]['firstname'] . ' ' . $drivers[$driverIndex]['lastname'] : 
            "Unassigned Driver";
        
        // Generate random volume (in real app, this would be estimated based on barangay size)
        $volume = number_format(rand(10, 40) / 10, 1) . " tons";
        
        // Format datetime
        $datetime = $schedule['scheduled_date'] . ", " . 
                   date('H:i', strtotime($schedule['start_time'])) . " - " . 
                   date('H:i', strtotime($schedule['end_time']));
        
        $formattedRoutes[] = [
            'schedule_id' => $schedule['schedule_id'],
            'name' => $routeName,
            'truck' => $truck,
            'driver' => $driver,
            'driverPhone' => count($drivers) > 0 ? $drivers[$driverIndex]['contact_num'] : "+63 912 345 6789", // Default phone number
            'barangay' => ucwords(strtolower($schedule['barangay_name'])),
            'datetime' => $datetime,
            'volume' => $volume,
            'status' => 'Scheduled',
            'statusColor' => ['bg' => '#dbeafe', 'color' => '#2563eb'],
            'coordinates' => $schedule['latitude'] && $schedule['longitude'] ? 
                [(float)$schedule['latitude'], (float)$schedule['longitude']] : 
                getBarangayCoordinates($schedule['barangay_name']),
            'collectionPoints' => generateCollectionPoints($schedule['barangay_name'], $schedule['start_time'], $schedule['end_time'], $schedule['location_name']),
            'driverNotes' => '',
            'complaints' => [],
            'locationName' => $schedule['location_name'] ?: 'Main Area',
            'latitude' => $schedule['latitude'] ?: null,
            'longitude' => $schedule['longitude'] ?: null
        ];
    }
    
    echo json_encode([
        'success' => true,
        'routes' => $formattedRoutes,
        'total' => count($formattedRoutes),
        'message' => 'Note: Driver and truck assignments are currently simulated. Create collection_team table for real assignments.'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

// Helper function to get barangay coordinates
function getBarangayCoordinates($barangayName) {
    $coordinates = [
        "Sagrada Familia" => [13.8142517, 122.9986921],
        "Aldezar" => [13.8000, 122.9500],
        "Bulan" => [13.7500, 122.9550],
        "Biglaan" => [13.7700, 122.9950],
        "Salvacion" => [13.6350, 122.7250],
        "Alteza" => [13.7900, 122.9600],
        "Anib" => [13.7850, 122.9700],
        "Awayan" => [13.7800, 122.9800],
        "Azucena" => [13.7750, 122.9900],
        "Bagong Sirang" => [13.7700, 122.9950],
        "Binahian" => [13.7650, 122.9850],
        "Bolo Norte" => [13.7600, 122.9750],
        "Bolo Sur" => [13.7550, 122.9650],
        "Bulawan" => [13.7450, 122.9450],
        "Cabuyao" => [13.7400, 122.9350],
        "Caima" => [13.7350, 122.9250],
        "Calagbangan" => [13.7300, 122.9150],
        "Calampinay" => [13.7250, 122.9050],
        "Carayrayan" => [13.7200, 122.8950],
        "Cotmo" => [13.7150, 122.8850],
        "Gabi" => [13.7100, 122.8750],
        "Gaongan" => [13.7766, 122.9826],
        "Impig" => [13.7050, 122.8650],
        "Lipilip" => [13.7000, 122.8550],
        "Lubigan Jr." => [13.6950, 122.8450],
        "Lubigan Sr." => [13.6900, 122.8350],
        "Malaguico" => [13.6850, 122.8250],
        "Malubago" => [13.6800, 122.8150],
        "Manangle" => [13.6750, 122.8050],
        "Mangapo" => [13.6700, 122.7950],
        "Mangga" => [13.6650, 122.7850],
        "Manlubang" => [13.6600, 122.7750],
        "Mantila" => [13.6550, 122.7650],
        "North Centro (Poblacion)" => [13.7760, 122.9830],
        "North Villazar" => [13.6500, 122.7550],
        "Salanda" => [13.6400, 122.7350],
        "San Isidro" => [13.6300, 122.7150],
        "San Vicente" => [13.6250, 122.7050],
        "Serranzana" => [13.6200, 122.6950],
        "South Centro (Poblacion)" => [13.7755, 122.9820],
        "South Villazar" => [13.6150, 122.6850],
        "Taisan" => [13.6100, 122.6750],
        "Tara" => [13.6050, 122.6650],
        "Tible" => [13.6000, 122.6550],
        "Tula-tula" => [13.5950, 122.6450],
        "Vigaan" => [13.5900, 122.6350],
        "Yabo" => [13.5850, 122.6250]
    ];
    
    return $coordinates[$barangayName] ?? [13.7766, 122.9826]; // Default to Sipocot center
}

// Helper function to generate collection points
function generateCollectionPoints($barangayName, $startTime, $endTime, $locationName) {
    $points = [];
    $startHour = (int)date('H', strtotime($startTime));
    $endHour = (int)date('H', strtotime($endTime));
    $duration = $endHour - $startHour;
    
    // Use actual location name if available, otherwise generate generic names
    $baseLocationName = $locationName ?: $barangayName;
    
    for ($i = 0; $i < 3; $i++) {
        $timeOffset = floor(($duration / 3) * $i);
        $pointTime = sprintf('%02d:%02d', $startHour + $timeOffset, $i === 0 ? 0 : ($i === 1 ? 30 : 0));
        
        if ($locationName) {
            // Use actual location name with point number
            $pointName = $locationName . " Point " . ($i + 1);
        } else {
            // Fallback to generic names
            $pointName = $barangayName . " Point " . ($i + 1);
        }
        
        // Get base coordinates from barangay
        $baseCoords = getBarangayCoordinates($barangayName);
        
        $points[] = [
            'name' => $pointName,
            'time' => $pointTime,
            'volume' => number_format(rand(3, 10) / 10, 1) . " tons",
            'coordinates' => [
                $baseCoords[0] + (rand(-50, 50) / 10000),
                $baseCoords[1] + (rand(-50, 50) / 10000)
            ]
        ];
    }
    
    return $points;
}
?>
