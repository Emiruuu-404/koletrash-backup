<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->connect();

$barangay_id = isset($_GET['barangay_id']) ? $_GET['barangay_id'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;

if (!$barangay_id || !$date) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing barangay_id or date parameter.'
    ]);
    exit();
}

try {
    // Fetch assignment for the given barangay and date
    $query = "SELECT * FROM task_assignment WHERE barangay_id = :barangay_id AND date = :date LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':barangay_id', $barangay_id);
    $stmt->bindParam(':date', $date);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'No assignment found.'
        ]);
        exit();
    }

    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get truck driver info
    $driverQuery = "SELECT id, full_name FROM users WHERE id = :id";
    $driverStmt = $db->prepare($driverQuery);
    $driverStmt->bindParam(':id', $assignment['truck_driver_id']);
    $driverStmt->execute();
    $truck_driver = $driverStmt->fetch(PDO::FETCH_ASSOC);

    // Get garbage collectors for this task
    $gcQuery = "SELECT u.id, u.full_name 
                FROM task_garbage_collector tgc
                JOIN users u ON tgc.garbage_collector_id = u.id
                WHERE tgc.task_id = :task_id
                LIMIT 3";
    $gcStmt = $db->prepare($gcQuery);
    $gcStmt->bindParam(':task_id', $assignment['task_id']);
    $gcStmt->execute();
    $garbage_collectors = $gcStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'truck_driver' => $truck_driver,
        'garbage_collectors' => $garbage_collectors
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} 
