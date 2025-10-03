<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $database = new Database();
    $db = $database->connect();

    try {
        // Debug: Check if there are any records in the table
        $countQuery = "SELECT COUNT(*) as total FROM issue_reports";
        $countStmt = $db->query($countQuery);
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Basic query to get all required fields
        $query = "SELECT 
            ir.id,
            ir.issue_type,
            ir.description,
            ir.photo_url,
            ir.created_at,
            ir.status,
            ir.reporter_id,
            up.firstname,
            up.lastname,
            b.barangay_name
        FROM issue_reports ir
        LEFT JOIN user_profile up ON ir.reporter_id = up.user_id
        LEFT JOIN barangay b ON up.barangay_id = b.barangay_id";

        // Add WHERE clause based on status
        if (isset($_GET['status'])) {
            if ($_GET['status'] === 'resolved') {
                $query .= " WHERE ir.status = 'resolved'";
            } else if ($_GET['status'] === 'active') {
                $query .= " WHERE (ir.status = 'active' OR ir.status = 'open' OR ir.status IS NULL)";
            }
        }

        $query .= " ORDER BY ir.created_at DESC";

        // Debug: Log the query being executed
        error_log("Executing query: " . $query);

        $stmt = $db->prepare($query);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $issues = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Handle photo URL - make sure it's a full URL
                $photo_url = $row['photo_url'];
                if ($photo_url && strpos($photo_url, 'http') !== 0) {
                    $photo_url = 'http://localhost/koletrash/' . ltrim($photo_url, '/');
                }
                
                $issue = array(
                    'id' => $row['id'],
                    'name' => trim($row['firstname'] . ' ' . $row['lastname']),
                    'barangay' => $row['barangay_name'],
                    'issue_type' => $row['issue_type'],
                    'description' => $row['description'],
                    'photo_url' => $photo_url,
                    'created_at' => $row['created_at'],
                    'status' => $row['status'] ?? 'active'
                );
                array_push($issues, $issue);
            }

            echo json_encode([
                'status' => 'success',
                'total_records' => $totalCount,
                'filtered_count' => count($issues),
                'data' => $issues
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'total_records' => $totalCount,
                'filtered_count' => 0,
                'data' => []
            ]);
        }
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
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
