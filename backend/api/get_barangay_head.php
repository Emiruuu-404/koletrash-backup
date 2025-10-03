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

require_once '../config/Database.php';

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

// Get barangay from query parameter
$barangay = isset($_GET['barangay']) ? $_GET['barangay'] : null;

if (!$barangay) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Barangay parameter is required'
    ));
    exit();
}

try {
    // Query to get barangay head data by assigned barangay
    $query = "SELECT e.id, e.fullName, e.email, e.phone, e.bh_barangay, e.term_start, e.term_end 
              FROM employees e 
              WHERE e.role = 'barangayhead' AND e.bh_barangay = :barangay 
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':barangay', $barangay);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $barangayHead = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(array(
            'status' => 'success',
            'data' => array(
                'id' => $barangayHead['id'],
                'name' => $barangayHead['fullName'],
                'email' => $barangayHead['email'],
                'phone' => $barangayHead['phone'],
                'barangay' => $barangayHead['bh_barangay'],
                'termStart' => $barangayHead['term_start'],
                'termEnd' => $barangayHead['term_end']
            )
        ));
    } else {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'No barangay head found for the specified barangay'
        ));
    }
} catch (PDOException $e) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
}
?>
