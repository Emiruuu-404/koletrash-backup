<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once("../config/database.php");

try {
    $pdo = new PDO("mysql:host=localhost;dbname=kolektrash_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->prepare("SELECT * FROM barangay");
    $stmt->execute();
    $barangays = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "barangays" => $barangays]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
