<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/Database.php';

$database = new Database();
$db = $database->connect();

// Get user ID from query parameter
$user_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$user_id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    // Get user data
    $userQuery = "SELECT id, username, email, fullName, role, phone, assignedArea FROM users WHERE id = :id AND role = 'truckdriver' LIMIT 1";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $user_id);
    $userStmt->execute();

    if ($userStmt->rowCount() === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Truck driver not found'
        ]);
        exit();
    }

    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Get truck driver specific data
    $truckQuery = "SELECT license_number, truck_assigned, employment_date, status FROM truck_drivers WHERE user_id = :user_id";
    $truckStmt = $db->prepare($truckQuery);
    $truckStmt->bindParam(':user_id', $user_id);
    $truckStmt->execute();
    $truckDriver = $truckStmt->fetch(PDO::FETCH_ASSOC);

    // Combine user and truck driver data
    $combinedData = array_merge($user, $truckDriver ?: []);

    echo json_encode([
        'status' => 'success',
        'data' => $combinedData
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
