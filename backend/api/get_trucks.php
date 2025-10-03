<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    if (!$pdo) {
        throw new Exception('Database connection failed.');
    }

    $stmt = $pdo->prepare("SELECT truck_id, plate_num, capacity, truck_type, status FROM truck");
    $stmt->execute();
    $trucks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "trucks" => $trucks
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?> 
