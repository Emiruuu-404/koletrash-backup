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

// Get POST data from form data (multipart/form-data)
$reporter_id = $_POST['reporter_id'] ?? null;
$reporter_name = $_POST['reporter_name'] ?? null;
$barangay = $_POST['barangay'] ?? null;
$issue_type = $_POST['issue_type'] ?? null;
$description = $_POST['description'] ?? null;
$table = $_POST['table'] ?? 'issue_reports';

// Validate required fields
if (!$reporter_id || !$issue_type || !$description) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Missing required fields: reporter_id, issue_type, description'
    ));
    exit();
}

// Validate issue type
$valid_issue_types = ['Missed Collection', 'Damaged Bin', 'Irregular Schedule', 'Uncollected Waste', 'Overflowing Bins', 'Illegal Dumping', 'Other'];
if (!in_array($issue_type, $valid_issue_types)) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Invalid issue type'
    ));
    exit();
}

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

try {
    // If reporter_name is not provided, fetch it from the database
    if (!$reporter_name) {
        $nameQuery = "SELECT firstname, lastname FROM user_profile WHERE user_id = :user_id";
        $nameStmt = $db->prepare($nameQuery);
        $nameStmt->bindParam(':user_id', $reporter_id);
        $nameStmt->execute();
        
        if ($nameStmt->rowCount() > 0) {
            $userData = $nameStmt->fetch(PDO::FETCH_ASSOC);
            $reporter_name = trim($userData['firstname'] . ' ' . $userData['lastname']);
        } else {
            $reporter_name = 'Unknown User';
        }
    }
    
    // If barangay is not provided, fetch it from the database
    if (!$barangay) {
        $barangayQuery = "SELECT b.barangay_name FROM user_profile up 
                         LEFT JOIN barangay b ON up.barangay_id = b.barangay_id 
                         WHERE up.user_id = :user_id";
        $barangayStmt = $db->prepare($barangayQuery);
        $barangayStmt->bindParam(':user_id', $reporter_id);
        $barangayStmt->execute();
        
        if ($barangayStmt->rowCount() > 0) {
            $barangayData = $barangayStmt->fetch(PDO::FETCH_ASSOC);
            $barangay = $barangayData['barangay_name'] ?? 'Unknown Barangay';
        } else {
            $barangay = 'Unknown Barangay';
        }
    }
    
    // Handle photo upload if provided
    $photo_url = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../../uploads/issue_reports/';
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $file_type = $_FILES['photo']['type'];
        
        if (!in_array($file_type, $allowed_types)) {
            echo json_encode(array(
                'status' => 'error',
                'message' => 'Invalid file type. Only JPEG, PNG, and GIF images are allowed.'
            ));
            exit();
        }
        
        // Validate file size (max 5MB)
        $max_size = 5 * 1024 * 1024; // 5MB
        if ($_FILES['photo']['size'] > $max_size) {
            echo json_encode(array(
                'status' => 'error',
                'message' => 'File size too large. Maximum size is 5MB.'
            ));
            exit();
        }
        
        // Generate unique filename
        $file_extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $filename = 'issue_' . $reporter_id . '_' . time() . '_' . uniqid() . '.' . $file_extension;
        $file_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $file_path)) {
            $photo_url = 'uploads/issue_reports/' . $filename;
        } else {
            echo json_encode(array(
                'status' => 'error',
                'message' => 'Failed to upload photo'
            ));
            exit();
        }
    }
    
    // Insert into issue_reports table
    $query = "INSERT INTO issue_reports (reporter_id, reporter_name, barangay, issue_type, description, photo_url, status, created_at) 
              VALUES (:reporter_id, :reporter_name, :barangay, :issue_type, :description, :photo_url, 'pending', NOW())";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    $stmt->bindParam(':reporter_id', $reporter_id);
    $stmt->bindParam(':reporter_name', $reporter_name);
    $stmt->bindParam(':barangay', $barangay);
    $stmt->bindParam(':issue_type', $issue_type);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':photo_url', $photo_url);
    
    // Execute the query
    if ($stmt->execute()) {
        $issue_id = $db->lastInsertId();
        
        // Log the issue submission for tracking
        error_log("Issue report submitted - ID: $issue_id, Reporter: $reporter_id, Type: $issue_type");
        
        echo json_encode(array(
            'status' => 'success',
            'message' => 'Issue report submitted successfully',
            'data' => array(
                'issue_id' => $issue_id,
                'status' => 'pending',
                'photo_url' => $photo_url
            )
        ));
    } else {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Failed to submit issue report'
        ));
    }
    
} catch (PDOException $e) {
    error_log("Database error in submit_issue_report.php: " . $e->getMessage());
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
} catch (Exception $e) {
    error_log("General error in submit_issue_report.php: " . $e->getMessage());
    echo json_encode(array(
        'status' => 'error',
        'message' => 'An error occurred while processing your request'
    ));
}
?>
