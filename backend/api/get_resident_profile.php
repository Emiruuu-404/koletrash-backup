<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

require_once '../config/database.php';

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
        // Query specifically for resident profile data
        // Debug: Log the user_id we're searching for
        error_log("Searching for user_id: " . $user_id);
        
        $query = "SELECT up.user_id, up.firstname, up.lastname, up.address, up.barangay_id,
                        COALESCE(b.barangay_name, 'Not Assigneded') as barangay_name
                 FROM user_profile up 
                 LEFT JOIN barangay b ON up.barangay_id = b.barangay_id 
                 WHERE up.user_id = :user_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Debug: Log the data we found
            error_log("Found user data: " . print_r($result, true));
            
            // Make sure we have actual data before sending
            if ($result['firstname'] && $result['lastname']) {
                echo json_encode([
                    'status' => 'success',
                    'data' => [
                        'firstname' => $result['firstname'],
                        'lastname' => $result['lastname'],
                        'name' => trim($result['firstname'] . ' ' . $result['lastname']),
                        'barangay' => $result['barangay_name'],
                        'barangay_id' => $result['barangay_id'],
                        'address' => $result['address'],
                        'user_id' => $result['user_id']
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'User profile incomplete'
                ]);
            }
        } else {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'User profile not found'
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
