<?php
// Headers - Allow all origins for development
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    // Instantiate DB & connect
    $database = new Database();
    $db = $database->connect();

    if (!$db) {
        throw new Exception('Database connection failed.');
    }

    // Get user ID from query parameter
    $user_id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'User ID is required'
        ]);
        exit();
    }

    // Query to get user data from user, user_profile, role, and barangay tables
    $query = "SELECT u.user_id, u.username, u.email, u.status, up.firstname, up.lastname, up.contact_num as phone, up.address, up.barangay_id, b.barangay_name, r.role_name as role FROM user u LEFT JOIN user_profile up ON u.user_id = up.user_id LEFT JOIN role r ON u.role_id = r.role_id LEFT JOIN barangay b ON up.barangay_id = b.barangay_id WHERE u.user_id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $user_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(array(
            'status' => 'success',
            'data' => array(
                'id' => $user['user_id'],
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'status' => $user['status'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'full_name' => trim($user['firstname'] . ' ' . $user['lastname']),
                'phone' => $user['phone'],
                'address' => $user['address'],
                'barangay_id' => $user['barangay_id'],
                'barangay' => $user['barangay_name'],
                'role' => $user['role']
            )
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            'status' => 'error',
            'message' => 'User not found'
        ));
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
