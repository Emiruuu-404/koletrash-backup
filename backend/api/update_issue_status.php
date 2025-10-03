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
if (!isset($input['issue_id']) || !isset($input['status'])) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Missing required fields: issue_id, status'
    ));
    exit();
}

$issue_id = $input['issue_id'];
$status = $input['status'];
$resolved_by = $input['resolved_by'] ?? null;
$resolution_notes = $input['resolution_notes'] ?? null;
$priority = $input['priority'] ?? null;

// Validate status
$valid_statuses = ['pending', 'active', 'resolved', 'closed'];
if (!in_array($status, $valid_statuses)) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Invalid status. Must be one of: ' . implode(', ', $valid_statuses)
    ));
    exit();
}

// Validate priority if provided
if ($priority) {
    $valid_priorities = ['low', 'medium', 'high', 'urgent'];
    if (!in_array($priority, $valid_priorities)) {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Invalid priority. Must be one of: ' . implode(', ', $valid_priorities)
        ));
        exit();
    }
}

// Instantiate DB & connect
$database = new Database();
$db = $database->connect();

try {
    // Build update query
    $query = "UPDATE issue_reports SET status = :status";
    $params = array(':status' => $status, ':issue_id' => $issue_id);
    
    if ($resolved_by) {
        $query .= ", resolved_by = :resolved_by";
        $params[':resolved_by'] = $resolved_by;
    }
    
    if ($resolution_notes) {
        $query .= ", resolution_notes = :resolution_notes";
        $params[':resolution_notes'] = $resolution_notes;
    }
    
    if ($priority) {
        $query .= ", priority = :priority";
        $params[':priority'] = $priority;
    }
    
    if ($status === 'resolved' || $status === 'closed') {
        $query .= ", resolved_at = NOW()";
    }
    
    $query .= " WHERE id = :issue_id";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    // Execute the query
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            echo json_encode(array(
                'status' => 'success',
                'message' => 'Issue status updated successfully',
                'data' => array(
                    'issue_id' => $issue_id,
                    'status' => $status,
                    'updated_at' => date('Y-m-d H:i:s')
                )
            ));
        } else {
            echo json_encode(array(
                'status' => 'error',
                'message' => 'Issue not found or no changes made'
            ));
        }
    } else {
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Failed to update issue status'
        ));
    }
    
} catch (PDOException $e) {
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ));
}
?>
