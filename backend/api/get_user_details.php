<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

require_once '../config/database.php';
require_once '../models/User.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user ID from query parameter
    $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'User ID is required'
        ]);
        exit();
    }

    // Initialize database connection
    $database = new Database();
    $db = $database->connect();

    try {
        // Query to get user data joining user_profile and barangay tables
        $query = "SELECT u.user_id, u.username, u.email, 
                         up.firstname, up.lastname, up.contact_num, up.address, up.barangay_id,
                         b.barangay_name 
                  FROM user u
                  LEFT JOIN user_profile up ON u.user_id = up.user_id
                  LEFT JOIN barangay b ON up.barangay_id = b.barangay_id
                  WHERE u.user_id = :user_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'user_id' => $result['user_id'],
                    'username' => $result['username'],
                    'email' => $result['email'],
                    'firstname' => $result['firstname'],
                    'lastname' => $result['lastname'],
                    'name' => trim($result['firstname'] . ' ' . $result['lastname']),
                    'contact_num' => $result['contact_num'],
                    'address' => $result['address'],
                    'barangay_id' => $result['barangay_id'],
                    'barangay' => $result['barangay_name'] ?? 'Not Assigned'
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'User not found'
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }

} else {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
}
?>
