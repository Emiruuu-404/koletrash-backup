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
    // First, check if truck_drivers table exists, if not create it
    $checkTableQuery = "SHOW TABLES LIKE 'truck_drivers'";
    $checkTableStmt = $db->prepare($checkTableQuery);
    $checkTableStmt->execute();
    
    if ($checkTableStmt->rowCount() === 0) {
        // Create truck_drivers table
        $createTableQuery = "
            CREATE TABLE truck_drivers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                license_number VARCHAR(50),
                truck_assigned VARCHAR(50),
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

    // Update truck driver specific information
    $truckFields = [];
    $truckParams = [':user_id' => $data->id];

    if (isset($data->licenseNumber)) {
        $truckFields[] = 'license_number = :license_number';
        $truckParams[':license_number'] = $data->licenseNumber;
    }
    if (isset($data->truckAssigned)) {
        $truckFields[] = 'truck_assigned = :truck_assigned';
        $truckParams[':truck_assigned'] = $data->truckAssigned;
    }
    if (isset($data->employmentDate)) {
        $truckFields[] = 'employment_date = :employment_date';
        $truckParams[':employment_date'] = $data->employmentDate;
    }
    if (isset($data->status)) {
        $truckFields[] = 'status = :status';
        $truckParams[':status'] = $data->status;
    }

    // Check if truck driver record exists
    $checkDriverQuery = "SELECT id FROM truck_drivers WHERE user_id = :user_id";
    $checkDriverStmt = $db->prepare($checkDriverQuery);
    $checkDriverStmt->bindParam(':user_id', $data->id);
    $checkDriverStmt->execute();

    if ($checkDriverStmt->rowCount() > 0) {
        // Update existing truck driver record
        if (!empty($truckFields)) {
            $truckSql = 'UPDATE truck_drivers SET ' . implode(', ', $truckFields) . ' WHERE user_id = :user_id';
            $truckStmt = $db->prepare($truckSql);
            $truckStmt->execute($truckParams);
        }
    } else {
        // Insert new truck driver record
        if (!empty($truckFields)) {
            $insertFields = ['user_id'];
            $insertValues = [':user_id'];
            $insertParams = [':user_id' => $data->id];

            foreach ($truckParams as $key => $value) {
                if ($key !== ':user_id') {
                    $fieldName = str_replace(':', '', $key);
                    $insertFields[] = $fieldName;
                    $insertValues[] = $key;
                    $insertParams[$key] = $value;
                }
            }

            $insertSql = 'INSERT INTO truck_drivers (' . implode(', ', $insertFields) . ') VALUES (' . implode(', ', $insertValues) . ')';
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

    // Get truck driver data
    $truckQuery = "SELECT license_number, truck_assigned, employment_date, status FROM truck_drivers WHERE user_id = :user_id";
    $truckStmt = $db->prepare($truckQuery);
    $truckStmt->bindParam(':user_id', $data->id);
    $truckStmt->execute();
    $truckDriver = $truckStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Truck driver profile updated successfully',
        'data' => array_merge($user, $truckDriver ?: [])
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 
