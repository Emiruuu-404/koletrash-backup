<?php
require_once '../config/database.php';
require_once '../includes/cors.php';

// Prevent any output before headers
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get the posted data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }

    // Log incoming data for debugging
    error_log("Received feedback data: " . print_r($data, true));

    // Validate required fields (adjusted for schema flexibility)
    $required_fields = ['user_id', 'user_name', 'barangay', 'rating', 'message'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    // Initialize database connection
    $database = new Database();
    $conn = $database->connect();

    // Discover available columns on the feedback table
    $columnsStmt = $conn->query('SHOW COLUMNS FROM feedback');
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
        'user_id' => $resolveColumn(['user_id', 'resident_id', 'account_id']),
        'name' => $resolveColumn(['user_name', 'name', 'resident_name', 'full_name', 'fullname', 'user_fullname', 'resident_fullname', 'customer_name']),
        'barangay' => $resolveColumn(['barangay', 'barangay_name', 'resident_barangay', 'barangayid', 'barangay_id']),
        'rating' => $resolveColumn(['rating', 'score', 'stars']),
        'message' => $resolveColumn(['message', 'feedback', 'feedback_message', 'comments', 'remarks']),
        'feedback_type' => $resolveColumn(['feedback_type', 'type', 'category', 'feedbacktype']),
        'status' => $resolveColumn(['status', 'feedback_status']),
        'date_submitted' => $resolveColumn(['date_submitted', 'submitted_at', 'created_at', 'created', 'date'])
    ];

    foreach (['user_id', 'name', 'barangay', 'rating', 'message'] as $key) {
        if (!$columnMap[$key]) {
            throw new Exception("Feedback table is missing a required column for {$key}.");
        }
    }

    if ($columnMap['feedback_type'] && (!isset($data['feedback_type']) || $data['feedback_type'] === '')) {
        throw new Exception('Missing required field: feedback_type');
    }

    $insertColumns = [
        $columnMap['user_id'],
        $columnMap['name'],
        $columnMap['barangay'],
        $columnMap['rating'],
        $columnMap['message']
    ];

    $placeholders = [
        ':user_id',
        ':user_name',
        ':barangay',
        ':rating',
        ':message'
    ];

    $bindings = [
        ':user_id' => [$data['user_id'], PDO::PARAM_STR],
        ':user_name' => [$data['user_name'], PDO::PARAM_STR],
        ':barangay' => [$data['barangay'], PDO::PARAM_STR],
        ':rating' => [intval($data['rating']), PDO::PARAM_INT],
        ':message' => [$data['message'], PDO::PARAM_STR]
    ];

    if ($columnMap['feedback_type']) {
        $insertColumns[] = $columnMap['feedback_type'];
        $placeholders[] = ':feedback_type';
        $bindings[':feedback_type'] = [$data['feedback_type'], PDO::PARAM_STR];
    }

    if ($columnMap['status']) {
        $insertColumns[] = $columnMap['status'];
        $placeholders[] = ':status';
        $bindings[':status'] = [isset($data['status']) && $data['status'] !== '' ? $data['status'] : 'active', PDO::PARAM_STR];
    }

    if ($columnMap['date_submitted']) {
        $insertColumns[] = $columnMap['date_submitted'];
        $placeholders[] = ':date_submitted';
        $bindings[':date_submitted'] = [date('Y-m-d H:i:s'), PDO::PARAM_STR];
    }

    $sql = sprintf(
        'INSERT INTO feedback (%s) VALUES (%s)',
        implode(', ', $insertColumns),
        implode(', ', $placeholders)
    );

    $stmt = $conn->prepare($sql);

    foreach ($bindings as $placeholder => [$value, $type]) {
        $stmt->bindValue($placeholder, $value, $type);
    }

    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Feedback submitted successfully',
            'data' => ['id' => $conn->lastInsertId()]
        ]);
    } else {
        throw new Exception('Failed to insert feedback');
    }

} catch (Exception $e) {
    error_log("Feedback submission error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    // Clean any buffered output
    ob_end_flush();
}
?>
