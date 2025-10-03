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

require_once '../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Method not allowed'
    ));
    exit();
}

// Get user ID from query parameters
$user_id = $_GET['user_id'] ?? null;
$user_role = $_GET['role'] ?? null;
$status = $_GET['status'] ?? null;

if (!$user_id) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'User ID is required'
    ));
    exit();
}

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

try {
    // Build query based on user role
    if ($user_role === 'Barangay Head' || $user_role === 'barangay_head') {
        // Barangay heads can see all issues from their barangay
        $query = "SELECT 
            ir.id,
            ir.issue_type,
            ir.description,
            ir.photo_url,
            ir.created_at,
            ir.status,
            ir.priority,
            ir.reporter_id,
            up.firstname,
            up.lastname,
            b.barangay_name
        FROM issue_reports ir
        LEFT JOIN user_profile up ON ir.reporter_id = up.user_id
        LEFT JOIN barangay b ON up.barangay_id = b.barangay_id
        WHERE up.barangay_id = (SELECT barangay_id FROM user_profile WHERE user_id = :user_id)";
    } else {
        // Residents can only see their own issues
        $query = "SELECT 
            ir.id,
            ir.issue_type,
            ir.description,
            ir.photo_url,
            ir.created_at,
            ir.status,
            ir.priority,
            ir.reporter_id,
            up.firstname,
            up.lastname,
            b.barangay_name
        FROM issue_reports ir
        LEFT JOIN user_profile up ON ir.reporter_id = up.user_id
        LEFT JOIN barangay b ON up.barangay_id = b.barangay_id
        WHERE ir.reporter_id = :user_id";
    }
    
    // Add status filter if provided
    if ($status) {
        if ($status === 'resolved') {
            $query .= " AND ir.status = 'resolved'";
        } else if ($status === 'active') {
            $query .= " AND (ir.status = 'active' OR ir.status = 'pending' OR ir.status IS NULL)";
        } else {
            $query .= " AND ir.status = :status";
        }
    }
    
    $query .= " ORDER BY ir.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    
    if ($status && $status !== 'resolved' && $status !== 'active') {
        $stmt->bindParam(':status', $status);
    }
    
    $stmt->execute();
    
    $issues = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Handle photo URL - make sure it's a full URL
        $photo_url = $row['photo_url'];
        if ($photo_url && strpos($photo_url, 'http') !== 0) {
            $photo_url = 'http://localhost/koletrash/' . ltrim($photo_url, '/');
        }
        
        $issue = array(
            'id' => $row['id'],
            'name' => trim($row['firstname'] . ' ' . $row['lastname']),
            'barangay' => $row['barangay_name'],
            'issue_type' => $row['issue_type'],
            'description' => $row['description'],
            'photo_url' => $photo_url,
            'created_at' => $row['created_at'],
            'status' => $row['status'] ?? 'pending',
            'priority' => $row['priority'] ?? 'medium'
        );
        array_push($issues, $issue);
    }
    
    echo json_encode(array(
        'status' => 'success',
        'data' => $issues,
        'count' => count($issues)
    ));
    
} catch (PDOException $e) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
}
?>


