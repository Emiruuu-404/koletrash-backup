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
    $userQuery = "SELECT id, username, email, fullName, role, phone, assignedArea FROM users WHERE id = :id AND role = 'garbagecollector' LIMIT 1";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $user_id);
    $userStmt->execute();

    if ($userStmt->rowCount() === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Garbage collector not found'
        ]);
        exit();
    }

    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Get garbage collector specific data
    $collectorQuery = "SELECT employee_id, assigned_area, employment_date, status FROM garbage_collectors WHERE user_id = :user_id";
    $collectorStmt = $db->prepare($collectorQuery);
    $collectorStmt->bindParam(':user_id', $user_id);
    $collectorStmt->execute();
    $garbageCollector = $collectorStmt->fetch(PDO::FETCH_ASSOC);

    // Combine user and garbage collector data
    $combinedData = array_merge($user, $garbageCollector ?: []);

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
