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

try {
    // Check what tables exist that might be referenced
    $stmt = $db->prepare("SHOW TABLES LIKE '%type%'");
    $stmt->execute();
    $typeTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Check user table for valid created_by values
    $stmt = $db->prepare("SELECT user_id, username FROM user LIMIT 5");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check if there's a collection_type table
    $stmt = $db->prepare("SHOW TABLES LIKE 'collection_type'");
    $stmt->execute();
    $hasCollectionType = $stmt->rowCount() > 0;
    
    $collectionTypes = [];
    if ($hasCollectionType) {
        $stmt = $db->prepare("SELECT * FROM collection_type");
        $stmt->execute();
        $collectionTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode([
        'success' => true,
        'type_tables' => $typeTables,
        'has_collection_type' => $hasCollectionType,
        'collection_types' => $collectionTypes,
        'sample_users' => $users
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?> 
