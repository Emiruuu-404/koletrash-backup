<?php
require_once __DIR__ . '/_bootstrap.php';
// CORS headers are already set by _bootstrap.php via cors.php
require_once("../config/database.php");

try {
    $database = new Database();
    $pdo = $database->connect();
    $stmt = $pdo->prepare("SELECT * FROM barangay");
    $stmt->execute();
    $barangays = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "barangays" => $barangays]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
