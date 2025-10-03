<?php
// Prevent any output buffering issues
ob_start();

// Include required files
require_once('../config/database.php');
require_once('../includes/cors.php');

// Clear any existing output
ob_clean();

// Set JSON header
header('Content-Type: application/json');

try {
    // Create database instance
    $database = new Database();
    $db = $database->connect();

    // Check database connection
    if ($db === false) {
        throw new Exception('Database connection failed');
    }

    $columnsStmt = $db->query('SHOW COLUMNS FROM feedback');
    $columnsData = $columnsStmt->fetchAll(PDO::FETCH_ASSOC);
    $availableLookup = [];
    foreach ($columnsData as $column) {
        $availableLookup[strtolower($column['Field'])] = $column['Field'];
    }

    $resolveColumn = function (array $candidates) use ($availableLookup) {
        foreach ($candidates as $candidate) {
            $key = strtolower($candidate);
            if (isset($availableLookup[$key])) {
                return $availableLookup[$key];
            }
        }
        return null;
    };

    $columnMap = [
        'id' => $resolveColumn(['id', 'feedback_id', 'feedbackid']),
        'user_id' => $resolveColumn(['user_id', 'resident_id', 'account_id']),
        'user_name' => $resolveColumn(['user_name', 'name', 'resident_name', 'full_name', 'fullname', 'user_fullname', 'resident_fullname', 'customer_name']),
        'barangay' => $resolveColumn(['barangay', 'barangay_name', 'resident_barangay', 'barangayid', 'barangay_id']),
        'rating' => $resolveColumn(['rating', 'score', 'stars']),
        'message' => $resolveColumn(['message', 'feedback', 'feedback_message', 'comments', 'remarks']),
        'date_submitted' => $resolveColumn(['date_submitted', 'submitted_at', 'created_at', 'created', 'date']),
        'feedback_type' => $resolveColumn(['feedback_type', 'type', 'category', 'feedbacktype']),
        'status' => $resolveColumn(['status', 'feedback_status'])
    ];

    $selectParts = [
        $columnMap['id'] ? $columnMap['id'] . ' AS id' : 'NULL AS id',
        $columnMap['user_id'] ? $columnMap['user_id'] . ' AS user_id' : 'NULL AS user_id',
        $columnMap['user_name'] ? $columnMap['user_name'] . ' AS user_name' : "'' AS user_name",
        $columnMap['barangay'] ? $columnMap['barangay'] . ' AS barangay' : "'' AS barangay",
        $columnMap['rating'] ? $columnMap['rating'] . ' AS rating' : 'NULL AS rating',
        $columnMap['message'] ? $columnMap['message'] . ' AS message' : "'' AS message",
        $columnMap['date_submitted'] ? $columnMap['date_submitted'] . ' AS date_submitted' : 'NULL AS date_submitted',
        $columnMap['feedback_type'] ? $columnMap['feedback_type'] . ' AS feedback_type' : "'' AS feedback_type"
    ];

    $query = "SELECT 
        " . implode(",\n        ", $selectParts) . "
    FROM feedback";

    $conditions = [];
    if ($columnMap['status']) {
        $conditions[] = $columnMap['status'] . " = 'active'";
    }

    if (!empty($conditions)) {
        $query .= "\n    WHERE " . implode(' AND ', $conditions);
    }

    $orderColumn = $columnMap['date_submitted'] ?? $columnMap['id'];
    if ($orderColumn) {
        $query .= "\n    ORDER BY {$orderColumn} DESC";
    }

    $stmt = $db->prepare($query);
    $stmt->execute();
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($feedbacks)) {
        echo json_encode([
            'status' => 'success',
            'data' => [],
            'message' => 'No feedback records found'
        ]);
        exit;
    }

    // Format the data
    $formattedFeedbacks = array_map(function($feedback) {
        return [
            'id' => $feedback['id'],
            'userId' => $feedback['user_id'],
            'userName' => $feedback['user_name'],
            'barangay' => $feedback['barangay'],
            'rating' => isset($feedback['rating']) ? (int)$feedback['rating'] : null,
            'message' => $feedback['message'],
            'date' => $feedback['date_submitted'],
            'type' => $feedback['feedback_type']
        ];
    }, $feedbacks);

    // Ensure clean output
    ob_clean();
    echo json_encode([
        'status' => 'success',
        'data' => $formattedFeedbacks
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch(PDOException $e) {
    error_log('Database Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error occurred',
        'debug_message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} catch(Exception $e) {
    error_log('General Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred',
        'debug_message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

// Ensure no additional output
exit();
?>
