<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->connect();

    // Check if columns exist
    $columnsQuery = "SHOW COLUMNS FROM issue_reports";
    $columnsStmt = $db->query($columnsQuery);
    $columns = $columnsStmt->fetchAll(PDO::FETCH_COLUMN);

    $alterStatements = [];

    // Only add columns that don't exist
    if (!in_array('status', $columns)) {
        $alterStatements[] = "ADD COLUMN status VARCHAR(20) DEFAULT 'open'";
    }

    if (!in_array('resolved_by_admin', $columns)) {
        $alterStatements[] = "ADD COLUMN resolved_by_admin TINYINT(1) DEFAULT 0";
    }

    if (!in_array('updated_at', $columns)) {
        $alterStatements[] = "ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
    }

    if (!empty($alterStatements)) {
        $alterQuery = "ALTER TABLE issue_reports " . implode(", ", $alterStatements);
        $db->exec($alterQuery);
        echo json_encode([
            'status' => 'success',
            'message' => 'Successfully updated issue_reports table schema'
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => 'No schema updates needed - all columns already exist'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
