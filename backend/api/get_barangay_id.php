<?php
require_once '../config/database.php';
require_once '../includes/cors.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $barangay_name = $_GET['name'] ?? '';
        if (empty($barangay_name)) {
            throw new Exception('Barangay name is required');
        }

        $database = new Database();
        $conn = $database->connect();

        $sql = "SELECT barangay_id FROM barangay WHERE barangay_name = :name LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':name', $barangay_name, PDO::PARAM_STR);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            echo json_encode([
                'status' => 'success',
                'data' => $result['barangay_id']
            ]);
        } else {
            throw new Exception('Barangay not found');
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
}
