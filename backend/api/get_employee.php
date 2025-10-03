<?php
require_once '../includes/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get the employee ID from query parameter
    $employeeId = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$employeeId) {
        http_response_code(400);
        echo json_encode(array("message" => "Employee ID is required"));
        exit;
    }

    // Get employee data with additional profile information
    $query = "SELECT e.*, 
                     gc.vehicle_assigned as gc_vehicle,
                     gc.route_assigned as gc_route,
                     gc.shift_start as gc_shift_start,
                     gc.shift_end as gc_shift_end,
                     td.license_number,
                     td.license_expiry,
                     td.vehicle_assigned as td_vehicle,
                     td.routes_assigned as td_routes,
                     bh.barangay_assigned as bh_barangay,
                     bh.term_start,
                     bh.term_end
              FROM employees e
              LEFT JOIN garbage_collectors gc ON e.id = gc.employee_id
              LEFT JOIN truck_drivers td ON e.id = td.employee_id
              LEFT JOIN barangay_heads bh ON e.id = bh.employee_id
              WHERE e.id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $employeeId);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent tasks for this employee
        $tasksQuery = "SELECT ct.id, ct.task_type, ct.status, ct.priority, ct.notes,
                              cs.area_name, cs.collection_day, cs.collection_time,
                              ct.created, ct.updated
                       FROM collection_tasks ct
                       JOIN collection_schedules cs ON ct.schedule_id = cs.id
                       WHERE ct.collector_id = :employee_id 
                       ORDER BY ct.created DESC 
                       LIMIT 10";
        $tasksStmt = $db->prepare($tasksQuery);
        $tasksStmt->bindParam(":employee_id", $employeeId);
        $tasksStmt->execute();
        $recentTasks = $tasksStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get supervisor info if exists
        $supervisor = null;
        if ($employee['supervisor_id']) {
            $supervisorQuery = "SELECT fullName, role, email FROM employees WHERE id = :supervisor_id";
            $supervisorStmt = $db->prepare($supervisorQuery);
            $supervisorStmt->bindParam(":supervisor_id", $employee['supervisor_id']);
            $supervisorStmt->execute();
            if ($supervisorStmt->rowCount() > 0) {
                $supervisor = $supervisorStmt->fetch(PDO::FETCH_ASSOC);
            }
        }

        // Structure the response based on role
        $responseData = array(
            "id" => $employee['id'],
            "employee_id" => $employee['employee_id'],
            "username" => $employee['username'],
            "email" => $employee['email'],
            "fullName" => $employee['fullName'],
            "role" => $employee['role'],
            "phone" => $employee['phone'],
            "assignedArea" => $employee['assignedArea'],
            "department" => $employee['department'],
            "employment_date" => $employee['employment_date'],
            "status" => $employee['status'],
            "last_login" => $employee['last_login'],
            "created" => $employee['created'],
            "updated" => $employee['updated'],
            "userType" => "employee",
            "supervisor" => $supervisor
        );

        // Add role-specific data
        if ($employee['role'] === 'garbagecollector') {
            $responseData['profile'] = array(
                "vehicle_assigned" => $employee['gc_vehicle'],
                "route_assigned" => $employee['gc_route'],
                "shift_start" => $employee['gc_shift_start'],
                "shift_end" => $employee['gc_shift_end']
            );
        } elseif ($employee['role'] === 'truckdriver') {
            $responseData['profile'] = array(
                "license_number" => $employee['license_number'],
                "license_expiry" => $employee['license_expiry'],
                "vehicle_assigned" => $employee['td_vehicle'],
                "routes_assigned" => $employee['td_routes']
            );
        } elseif ($employee['role'] === 'barangayhead') {
            $responseData['profile'] = array(
                "barangay_assigned" => $employee['bh_barangay'],
                "term_start" => $employee['term_start'],
                "term_end" => $employee['term_end']
            );
        }

        echo json_encode(array(
            "message" => "Employee data retrieved successfully",
            "employee" => $responseData,
            "recentTasks" => $recentTasks
        ));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Employee not found"));
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server error: " . $e->getMessage()));
}
?>
