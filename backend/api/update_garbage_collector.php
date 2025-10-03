<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/Database.php';

$database = new Database();
$db = $database->connect();

$json_input = file_get_contents("php://input");
$data = json_decode($json_input);

if (!$data || !isset($data->id)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    // First, check if garbage_collectors table exists, if not create it
    $checkTableQuery = "SHOW TABLES LIKE 'garbage_collectors'";
    $checkTableStmt = $db->prepare($checkTableQuery);
    $checkTableStmt->execute();
    
    if ($checkTableStmt->rowCount() === 0) {
        // Create garbage_collectors table
        $createTableQuery = "
            CREATE TABLE garbage_collectors (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                employee_id VARCHAR(50),
                assigned_area VARCHAR(100),
                employment_date DATE,
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ";
        $db->exec($createTableQuery);
    }

    // Update user profile information in users table
    $userFields = [];
    $userParams = [':id' => $data->id];

    if (isset($data->fullName)) {
        $userFields[] = 'fullName = :fullName';
        $userParams[':fullName'] = $data->fullName;
    }
    if (isset($data->email)) {
        $userFields[] = 'email = :email';
        $userParams[':email'] = $data->email;
    }
    if (isset($data->phone)) {
        $userFields[] = 'phone = :phone';
        $userParams[':phone'] = $data->phone;
    }

    // Update user table if there are fields to update
    if (!empty($userFields)) {
        $userSql = 'UPDATE users SET ' . implode(', ', $userFields) . ' WHERE id = :id';
        $userStmt = $db->prepare($userSql);
        $userStmt->execute($userParams);
    }

    // Update garbage collector specific information
    $collectorFields = [];
    $collectorParams = [':user_id' => $data->id];

    if (isset($data->employeeId)) {
        $collectorFields[] = 'employee_id = :employee_id';
        $collectorParams[':employee_id'] = $data->employeeId;
    }
    if (isset($data->assignedArea)) {
        $collectorFields[] = 'assigned_area = :assigned_area';
        $collectorParams[':assigned_area'] = $data->assignedArea;
    }
    if (isset($data->employmentDate)) {
        $collectorFields[] = 'employment_date = :employment_date';
        $collectorParams[':employment_date'] = $data->employmentDate;
    }
    if (isset($data->status)) {
        $collectorFields[] = 'status = :status';
        $collectorParams[':status'] = $data->status;
    }

    // Check if garbage collector record exists
    $checkCollectorQuery = "SELECT id FROM garbage_collectors WHERE user_id = :user_id";
    $checkCollectorStmt = $db->prepare($checkCollectorQuery);
    $checkCollectorStmt->bindParam(':user_id', $data->id);
    $checkCollectorStmt->execute();

    if ($checkCollectorStmt->rowCount() > 0) {
        // Update existing garbage collector record
        if (!empty($collectorFields)) {
            $collectorSql = 'UPDATE garbage_collectors SET ' . implode(', ', $collectorFields) . ' WHERE user_id = :user_id';
            $collectorStmt = $db->prepare($collectorSql);
            $collectorStmt->execute($collectorParams);
        }
    } else {
        // Insert new garbage collector record
        if (!empty($collectorFields)) {
            $insertFields = ['user_id'];
            $insertValues = [':user_id'];
            $insertParams = [':user_id' => $data->id];

            foreach ($collectorParams as $key => $value) {
                if ($key !== ':user_id') {
                    $fieldName = str_replace(':', '', $key);
                    $insertFields[] = $fieldName;
                    $insertValues[] = $key;
                    $insertParams[$key] = $value;
                }
            }

            $insertSql = 'INSERT INTO garbage_collectors (' . implode(', ', $insertFields) . ') VALUES (' . implode(', ', $insertValues) . ')';
            $insertStmt = $db->prepare($insertSql);
            $insertStmt->execute($insertParams);
        }
    }

    // Get updated user data
    $userQuery = "SELECT id, username, email, fullName, role, phone, assignedArea FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $data->id);
    $userStmt->execute();
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Get garbage collector data
    $collectorQuery = "SELECT employee_id, assigned_area, employment_date, status FROM garbage_collectors WHERE user_id = :user_id";
    $collectorStmt = $db->prepare($collectorQuery);
    $collectorStmt->bindParam(':user_id', $data->id);
    $collectorStmt->execute();
    $garbageCollector = $collectorStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Garbage collector profile updated successfully',
        'data' => array_merge($user, $garbageCollector ?: [])
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
