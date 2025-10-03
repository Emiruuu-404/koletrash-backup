<?php
require_once '../includes/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get the user ID from query parameter
    $userId = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(array("message" => "User ID is required"));
        exit;
    }

    // Get resident data
    $query = "SELECT id, username, email, fullName, phone, address, barangay, is_active, 
                     email_verified, created, updated 
              FROM users 
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $userId);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent pickup requests
        $requestsQuery = "SELECT id, waste_type, quantity_estimate, preferred_date, 
                                 status, created 
                          FROM pickup_requests 
                          WHERE user_id = :user_id 
                          ORDER BY created DESC 
                          LIMIT 5";
        $requestsStmt = $db->prepare($requestsQuery);
        $requestsStmt->bindParam(":user_id", $userId);
        $requestsStmt->execute();
        $recentRequests = $requestsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get collection schedule for user's barangay
        $scheduleQuery = "SELECT area_name, collection_day, collection_time, status 
                         FROM collection_schedules 
                         WHERE barangay = :barangay 
                         ORDER BY collection_day, collection_time";
        $scheduleStmt = $db->prepare($scheduleQuery);
        $scheduleStmt->bindParam(":barangay", $user['barangay']);
        $scheduleStmt->execute();
        $schedule = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(array(
            "message" => "Resident data retrieved successfully",
            "user" => array(
                "id" => $user['id'],
                "username" => $user['username'],
                "email" => $user['email'],
                "fullName" => $user['fullName'],
                "phone" => $user['phone'],
                "address" => $user['address'],
                "barangay" => $user['barangay'],
                "is_active" => $user['is_active'],
                "email_verified" => $user['email_verified'],
                "created" => $user['created'],
                "updated" => $user['updated'],
                "userType" => "resident"
            ),
            "recentRequests" => $recentRequests,
            "collectionSchedule" => $schedule
        ));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Resident not found"));
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server error: " . $e->getMessage()));
}
?>
