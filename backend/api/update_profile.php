<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/Database.php';

$database = new Database();
$db = $database->connect();

$json_input = file_get_contents("php://input");
$data = json_decode($json_input);

if (!$data || !isset($data->id)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    // Update user_profile table (only firstname, lastname, contact_num)
    $queryProfile = "UPDATE user_profile SET firstname = :firstname, lastname = :lastname, contact_num = :contact_num WHERE user_id = :id";
    $stmtProfile = $db->prepare($queryProfile);
    $stmtProfile->bindParam(':id', $data->id);
    $stmtProfile->bindParam(':firstname', $data->firstname);
    $stmtProfile->bindParam(':lastname', $data->lastname);
    $stmtProfile->bindParam(':contact_num', $data->phone); // phone from frontend
    $stmtProfile->execute();

    // Update email in user table
    $queryUser = "UPDATE user SET email = :email WHERE user_id = :id";
    $stmtUser = $db->prepare($queryUser);
    $stmtUser->bindParam(':id', $data->id);
    $stmtUser->bindParam(':email', $data->email);
    $stmtUser->execute();

    // Get updated user data (join user, user_profile, role)
    $userQuery = "SELECT u.user_id, u.username, u.email, up.firstname, up.lastname, up.contact_num as phone, up.address, up.barangay_id, r.role_name as role FROM user u LEFT JOIN user_profile up ON u.user_id = up.user_id LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $data->id);
    $userStmt->execute();
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully',
        'data' => $user
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
