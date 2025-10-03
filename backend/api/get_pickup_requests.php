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

// Get query parameters
$status = $_GET['status'] ?? null;
$barangay = $_GET['barangay'] ?? null;
$date_from = $_GET['date_from'] ?? null;
$date_to = $_GET['date_to'] ?? null;
$requester_id = $_GET['requester_id'] ?? null;

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

try {
    // Build query
    $query = "SELECT 
        pr.id,
        pr.requester_id,
        pr.requester_name,
        pr.barangay,
        pr.contact_number,
        pr.pickup_date,
        pr.waste_type,
        pr.notes,
        pr.status,
        pr.scheduled_date,
        pr.completed_date,
        pr.declined_reason,
        pr.admin_remarks,
        pr.created_at,
        pr.updated_at,
        pr.priority,
        up.firstname,
        up.lastname
    FROM pickup_requests pr
    LEFT JOIN user_profile up ON pr.requester_id = up.user_id";
    
    $whereConditions = array();
    $params = array();
    
    // Add filters
    if ($status && $status !== 'all') {
        $whereConditions[] = "pr.status = :status";
        $params[':status'] = $status;
    }
    
    if ($barangay && $barangay !== 'all') {
        $whereConditions[] = "pr.barangay = :barangay";
        $params[':barangay'] = $barangay;
    }
    
    if ($date_from) {
        $whereConditions[] = "pr.created_at >= :date_from";
        $params[':date_from'] = $date_from . ' 00:00:00';
    }
    
    if ($date_to) {
        $whereConditions[] = "pr.created_at <= :date_to";
        $params[':date_to'] = $date_to . ' 23:59:59';
    }
    
    if ($requester_id) {
        $whereConditions[] = "pr.requester_id = :requester_id";
        $params[':requester_id'] = $requester_id;
    }
    
    // Add WHERE clause if there are conditions
    if (!empty($whereConditions)) {
        $query .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $query .= " ORDER BY pr.created_at DESC";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    
    $requests = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $request = array(
            'id' => $row['id'],
            'requester_id' => $row['requester_id'],
            'requester_name' => $row['requester_name'],
            'barangay' => $row['barangay'],
            'contact_number' => $row['contact_number'],
            'pickup_date' => $row['pickup_date'],
            'waste_type' => $row['waste_type'],
            'notes' => $row['notes'],
            'status' => $row['status'],
            'scheduled_date' => $row['scheduled_date'],
            'completed_date' => $row['completed_date'],
            'declined_reason' => $row['declined_reason'],
            'admin_remarks' => $row['admin_remarks'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'priority' => $row['priority'] ?? 'medium'
        );
        array_push($requests, $request);
    }
    
    // Get statistics
    $statsQuery = "SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined
    FROM pickup_requests";
    
    $statsStmt = $db->query($statsQuery);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(array(
        'status' => 'success',
        'data' => $requests,
        'count' => count($requests),
        'statistics' => $stats
    ));
    
} catch (PDOException $e) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
}
?>


