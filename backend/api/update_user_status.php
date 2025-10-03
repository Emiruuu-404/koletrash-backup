<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");

$conn = (new Database())->connect();

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Invalid JSON input");
    }
    
    // Validate required fields
    if (!isset($input['user_id']) || !isset($input['status'])) {
        throw new Exception("Missing required fields: user_id and status");
    }
    
    $user_id = $input['user_id'];
    $status = $input['status'];
    
    // Validate status value
    $valid_statuses = ['On Duty', 'Off Duty', 'On Leave'];
    if (!in_array($status, $valid_statuses)) {
        throw new Exception("Invalid status. Must be one of: " . implode(', ', $valid_statuses));
    }
    
    // Check if user exists and is a staff member
    $checkStmt = $conn->prepare("SELECT u.user_id, r.role_name FROM user u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?");
    $checkStmt->execute([$user_id]);
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception("User not found");
    }
    
    // Only allow status updates for staff members (truck_driver, garbage_collector)
    $staff_types = ['truck_driver', 'garbage_collector'];
    if (!in_array($user['role_name'], $staff_types)) {
        throw new Exception("Status updates are only allowed for staff members (truck drivers and garbage collectors)");
    }
    
    // Update user status
    $updateStmt = $conn->prepare("UPDATE user SET status = ? WHERE user_id = ?");
    $result = $updateStmt->execute([$status, $user_id]);
    
    if ($result) {
        // Get updated user info
        $getUserStmt = $conn->prepare("SELECT u.user_id, CONCAT(COALESCE(up.firstname, ''), ' ', COALESCE(up.lastname, '')) AS full_name, u.email, u.username, up.barangay_id AS barangay, r.role_name AS user_type, u.status, 1 AS is_active FROM user u LEFT JOIN user_profile up ON u.user_id = up.user_id LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?");
        $getUserStmt->execute([$user_id]);
        $updatedUser = $getUserStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true, 
            "message" => "User status updated successfully",
            "user" => $updatedUser
        ]);
    } else {
        throw new Exception("Failed to update user status");
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}
?>
