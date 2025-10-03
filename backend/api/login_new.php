<?php
require_once '../includes/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get POST data
    $data = json_decode(file_get_contents("php://input"));

    if (!$data || !$data->username || !$data->password) {
        http_response_code(400);
        echo json_encode(array("message" => "Username and password are required"));
        exit;
    }

    $username = $data->username;
    $password = $data->password;

    // First check in employees table
    $query = "SELECT * FROM employees WHERE username = :username AND status = 'active'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($password, $employee['password'])) {
            // Update last login
            $updateQuery = "UPDATE employees SET last_login = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(":id", $employee['id']);
            $updateStmt->execute();

            // Return employee data
            echo json_encode(array(
                "message" => "Login successful",
                "user" => array(
                    "id" => $employee['id'],
                    "username" => $employee['username'],
                    "email" => $employee['email'],
                    "fullName" => $employee['fullName'],
                    "role" => $employee['role'],
                    "assignedArea" => $employee['assignedArea'],
                    "employeeId" => $employee['employee_id'],
                    "department" => $employee['department'],
                    "userType" => "employee"
                )
            ));
            exit;
        }
    }

    // If not found in employees, check in users table (residents)
    $query = "SELECT * FROM users WHERE username = :username AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($password, $user['password'])) {
            // Return user data
            echo json_encode(array(
                "message" => "Login successful",
                "user" => array(
                    "id" => $user['id'],
                    "username" => $user['username'],
                    "email" => $user['email'],
                    "fullName" => $user['fullName'],
                    "role" => "resident",
                    "barangay" => $user['barangay'],
                    "address" => $user['address'],
                    "phone" => $user['phone'],
                    "userType" => "resident"
                )
            ));
            exit;
        }
    }

    // If we reach here, login failed
    http_response_code(401);
    echo json_encode(array("message" => "Invalid username or password"));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server error: " . $e->getMessage()));
}
?>
