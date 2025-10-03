<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
$database = new Database();
$db = $database->connect();

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['assignment_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing assignment_id']);
    exit;
}
$team_id = $data['assignment_id'];

try {
    // Delete team members (collectors)
    $stmt = $db->prepare("DELETE FROM collection_team_member WHERE team_id = ?");
    $stmt->execute([$team_id]);
    
    // Delete notifications related to this team
    $stmt = $db->prepare("DELETE FROM notification WHERE JSON_EXTRACT(message, '$.team_id') = ?");
    $stmt->execute([$team_id]);
    
    // Delete collection team
    $stmt = $db->prepare("DELETE FROM collection_team WHERE team_id = ?");
    $stmt->execute([$team_id]);
    
    echo json_encode(['success' => true, 'message' => 'Assignment deleted successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 
