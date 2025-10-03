<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $pdo = new PDO("mysql:host=localhost;dbname=kolektrash_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch truck drivers (role_id = 2)
    $stmtDrivers = $pdo->prepare("SELECT * FROM user WHERE role_id = 3");
    $stmtDrivers->execute();
    $truckDrivers = $stmtDrivers->fetchAll(PDO::FETCH_ASSOC);

    // Fetch garbage collectors (role_id = 3)
    $stmtCollectors = $pdo->prepare("SELECT * FROM user WHERE role_id = 4");
    $stmtCollectors->execute();
    $garbageCollectors = $stmtCollectors->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "truck_drivers" => $truckDrivers,
        "garbage_collectors" => $garbageCollectors
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?> 
