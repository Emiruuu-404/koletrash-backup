<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once("../config/database.php");

$conn = (new Database())->connect();

try {
    $stmt = $conn->prepare("SELECT u.user_id AS id, CONCAT(COALESCE(up.firstname, ''), ' ', COALESCE(up.lastname, '')) AS full_name, u.email, u.username, up.barangay_id AS barangay, r.role_name AS user_type, u.status, 1 AS is_active FROM user u LEFT JOIN user_profile up ON u.user_id = up.user_id LEFT JOIN role r ON u.role_id = r.role_id");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "users" => $users]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>




