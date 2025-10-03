<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $barangay_id = isset($_GET['barangay_id']) ? $_GET['barangay_id'] : null;

    if (!$barangay_id) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Barangay ID is required'
        ]);
        exit();
    }

    try {
        $database = new Database();
        $db = $database->connect();

        // Query to get barangay details
        $query = "SELECT * FROM barangay WHERE barangay_id = :barangay_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':barangay_id', $barangay_id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $barangay = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                'status' => 'success',
                'data' => $barangay
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Barangay not found'
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
