<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $pdo = new PDO("mysql:host=localhost;dbname=kolektrash_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $debugData = [];

    // Check truck drivers (role_id = 3)
    $stmt = $pdo->prepare("
        SELECT u.user_id, u.username, 
               CONCAT(up.firstname, ' ', up.lastname) as full_name,
               up.status
        FROM user u 
        LEFT JOIN user_profile up ON u.user_id = up.user_id 
        WHERE u.role_id = 3
    ");
    $stmt->execute();
    $truckDrivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['truck_drivers'] = [
        'count' => count($truckDrivers),
        'data' => $truckDrivers
    ];

    // Check garbage collectors (role_id = 4)
    $stmt = $pdo->prepare("
        SELECT u.user_id, u.username, 
               CONCAT(up.firstname, ' ', up.lastname) as full_name,
               up.status
        FROM user u 
        LEFT JOIN user_profile up ON u.user_id = up.user_id 
        WHERE u.role_id = 4
    ");
    $stmt->execute();
    $garbageCollectors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['garbage_collectors'] = [
        'count' => count($garbageCollectors),
        'data' => $garbageCollectors
    ];

    // Check trucks
    $stmt = $pdo->prepare("SELECT truck_id, plate_num, truck_type, capacity, status FROM truck");
    $stmt->execute();
    $trucks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['trucks'] = [
        'count' => count($trucks),
        'data' => $trucks
    ];

    // Check available trucks
    $stmt = $pdo->prepare("SELECT truck_id, plate_num, truck_type, capacity, status FROM truck WHERE status = 'available'");
    $stmt->execute();
    $availableTrucks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['available_trucks'] = [
        'count' => count($availableTrucks),
        'data' => $availableTrucks
    ];

    // Check barangays
    $stmt = $pdo->prepare("SELECT barangay_id, barangay_name, cluster_id FROM barangay");
    $stmt->execute();
    $barangays = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['barangays'] = [
        'count' => count($barangays),
        'data' => $barangays
    ];

    // Check clusters
    $stmt = $pdo->prepare("SELECT DISTINCT cluster_id FROM barangay WHERE cluster_id IS NOT NULL");
    $stmt->execute();
    $clusters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['clusters'] = [
        'count' => count($clusters),
        'data' => $clusters
    ];

    // Check user roles
    $stmt = $pdo->prepare("SELECT role_id, role_name FROM role");
    $stmt->execute();
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debugData['roles'] = [
        'count' => count($roles),
        'data' => $roles
    ];

    echo json_encode([
        'success' => true,
        'debug_data' => $debugData
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?> 
