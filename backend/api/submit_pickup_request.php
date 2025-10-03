<?php
// Headers - Allow all origins for development
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Method not allowed'
    ));
    exit();
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['requester_id']) || !isset($input['contact_number']) || !isset($input['pickup_date']) || !isset($input['waste_type'])) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Missing required fields: requester_id, contact_number, pickup_date, waste_type'
    ));
    exit();
}

$requester_id = $input['requester_id'];
$requester_name = $input['requester_name'] ?? null;
$barangay = $input['barangay'] ?? null;
$contact_number = $input['contact_number'];
$pickup_date = $input['pickup_date'];
$waste_type = $input['waste_type'];
$notes = $input['notes'] ?? '';

// Validate pickup date (should not be in the past)
$today = date('Y-m-d');
if ($pickup_date < $today) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Pickup date cannot be in the past'
    ));
    exit();
}

// Validate contact number format (basic validation)
if (!preg_match('/^09[0-9]{9}$/', $contact_number)) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Invalid contact number format. Please use format: 09XXXXXXXXX'
    ));
    exit();
}

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

try {
    // If requester_name is not provided, fetch it from the database
    if (!$requester_name) {
        $nameQuery = "SELECT firstname, lastname FROM user_profile WHERE user_id = :user_id";
        $nameStmt = $db->prepare($nameQuery);
        $nameStmt->bindParam(':user_id', $requester_id);
        $nameStmt->execute();
        
        if ($nameStmt->rowCount() > 0) {
            $userData = $nameStmt->fetch(PDO::FETCH_ASSOC);
            $requester_name = trim($userData['firstname'] . ' ' . $userData['lastname']);
        } else {
            $requester_name = 'Unknown User';
        }
    }
    
    // If barangay is not provided, fetch it from the database
    if (!$barangay || $barangay === 'Not assigned' || $barangay === '') {
        $barangayQuery = "SELECT b.barangay_name FROM user_profile up 
                         LEFT JOIN barangay b ON up.barangay_id = b.barangay_id 
                         WHERE up.user_id = :user_id";
        $barangayStmt = $db->prepare($barangayQuery);
        $barangayStmt->bindParam(':user_id', $requester_id);
        $barangayStmt->execute();
        
        if ($barangayStmt->rowCount() > 0) {
            $barangayData = $barangayStmt->fetch(PDO::FETCH_ASSOC);
            $barangay = $barangayData['barangay_name'] ?? null;
        }
        
        // If still no barangay found, return error
        if (!$barangay || $barangay === 'Not assigned' || $barangay === '') {
            echo json_encode(array(
                'status' => 'error',
                'message' => 'Barangay information is missing. Please contact support to assign a barangay to your account.'
            ));
            exit();
        }
    }
    
    // Insert into pickup_requests table
    $query = "INSERT INTO pickup_requests (requester_id, requester_name, barangay, contact_number, pickup_date, waste_type, notes, status, created_at) 
              VALUES (:requester_id, :requester_name, :barangay, :contact_number, :pickup_date, :waste_type, :notes, 'pending', NOW())";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    $stmt->bindParam(':requester_id', $requester_id);
    $stmt->bindParam(':requester_name', $requester_name);
    $stmt->bindParam(':barangay', $barangay);
    $stmt->bindParam(':contact_number', $contact_number);
    $stmt->bindParam(':pickup_date', $pickup_date);
    $stmt->bindParam(':waste_type', $waste_type);
    $stmt->bindParam(':notes', $notes);
    
    // Execute the query
    if ($stmt->execute()) {
        $request_id = $db->lastInsertId();
        
        // Log the pickup request submission for tracking
        error_log("Pickup request submitted - ID: $request_id, Requester: $requester_id, Type: $waste_type");
        
        echo json_encode(array(
            'status' => 'success',
            'message' => 'Pickup request submitted successfully',
            'data' => array(
                'request_id' => $request_id,
                'status' => 'pending'
            )
        ));
    } else {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Failed to submit pickup request'
        ));
    }
    
} catch (PDOException $e) {
    error_log("Database error in submit_pickup_request.php: " . $e->getMessage());
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
} catch (Exception $e) {
    error_log("General error in submit_pickup_request.php: " . $e->getMessage());
    echo json_encode(array(
        'status' => 'error',
        'message' => 'An error occurred while processing your request'
    ));
}
?>
