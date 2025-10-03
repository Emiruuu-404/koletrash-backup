<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? '';
$firstname = $data['firstname'] ?? '';
$lastname = $data['lastname'] ?? '';
$contact_num = $data['contact_num'] ?? '';
$address = $data['address'] ?? '';
$barangay_id = $data['barangay_id'] ?? '';
$birthdate = $data['birthdate'] ?? null;
$gender = $data['gender'] ?? null;
$status = $data['status'] ?? null;

if (!$username || !$email || !$password || !$role || !$firstname || !$lastname || !$contact_num || !$address || !$barangay_id) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

// Map role string to role_id
$role_id = null;
try {
    $conn = (new Database())->connect();
    $stmt = $conn->prepare("SELECT role_id FROM role WHERE role_name = ? LIMIT 1");
    $stmt->execute([$role]);
    $roleRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($roleRow) {
        $role_id = $roleRow['role_id'];
    } else {
        echo json_encode(["success" => false, "message" => "Invalid role."]);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $conn->beginTransaction();
    // Insert into user
    $stmt = $conn->prepare("INSERT INTO user (username, email, password, role_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$username, $email, $passwordHash, $role_id]);
    $user_id = $conn->lastInsertId();

    // Insert into user_profile
    $stmt = $conn->prepare("INSERT INTO user_profile (user_id, firstname, lastname, birthdate, contact_num, gender, address, status, barangay_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $firstname, $lastname, $birthdate, $contact_num, $gender, $address, $status, $barangay_id]);

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Personnel account created."]);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
