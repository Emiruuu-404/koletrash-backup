<?php
/**
 * Migration script to transition from assignment/assignment_collector tables 
 * to collection_team/collection_team_member tables
 */

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->connect();
    
    echo "Starting migration...\n";
    
    // Check if old tables exist
    $stmt = $db->prepare("SHOW TABLES LIKE 'assignment'");
    $stmt->execute();
    $assignmentExists = $stmt->rowCount() > 0;
    
    $stmt = $db->prepare("SHOW TABLES LIKE 'assignment_collector'");
    $stmt->execute();
    $assignmentCollectorExists = $stmt->rowCount() > 0;
    
    if (!$assignmentExists || !$assignmentCollectorExists) {
        echo "Old tables don't exist. Migration not needed.\n";
        exit;
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    // Get all assignments from old table
    $stmt = $db->prepare("SELECT * FROM assignment ORDER BY assignment_id");
    $stmt->execute();
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($assignments) . " assignments to migrate.\n";
    
    foreach ($assignments as $assignment) {
        echo "Migrating assignment ID: " . $assignment['assignment_id'] . "\n";
        
        // Check if schedule exists for this assignment
        $schedule_id = null;
        if (!empty($assignment['barangay_id'])) {
            $stmt = $db->prepare("
                SELECT schedule_id FROM collection_schedule 
                WHERE barangay_id = ? AND scheduled_date = ? AND start_time = ?
            ");
            $stmt->execute([$assignment['barangay_id'], $assignment['date'], $assignment['time']]);
            $schedule = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($schedule) {
                $schedule_id = $schedule['schedule_id'];
            } else {
                // Create new schedule
                $stmt = $db->prepare("
                    INSERT INTO collection_schedule (barangay_id, scheduled_date, start_time, end_time, status) 
                    VALUES (?, ?, ?, ?, 'scheduled')
                ");
                $end_time = date('H:i:s', strtotime($assignment['time'] . ' +2 hours'));
                $stmt->execute([$assignment['barangay_id'], $assignment['date'], $assignment['time'], $end_time]);
                $schedule_id = $db->lastInsertId();
            }
        }
        
        if ($schedule_id) {
            // Create collection team
            $stmt = $db->prepare("
                INSERT INTO collection_team (schedule_id, truck_id, driver_id, status) 
                VALUES (?, ?, ?, ?)
            ");
            $status = $assignment['driver_response_status'] ?: 'pending';
            $stmt->execute([$schedule_id, $assignment['truck_id'], $assignment['driver_id'], $status]);
            $team_id = $db->lastInsertId();
            
            // Get collectors for this assignment
            $stmt = $db->prepare("
                SELECT collector_id, response_status 
                FROM assignment_collector 
                WHERE assignment_id = ?
            ");
            $stmt->execute([$assignment['assignment_id']]);
            $collectors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Insert collectors into new table
            foreach ($collectors as $collector) {
                $stmt = $db->prepare("
                    INSERT INTO collection_team_member (team_id, collector_id, response_status) 
                    VALUES (?, ?, ?)
                ");
                $status = $collector['response_status'] ?: 'pending';
                $stmt->execute([$team_id, $collector['collector_id'], $status]);
            }
            
            echo "  - Created team ID: " . $team_id . " with " . count($collectors) . " collectors\n";
        } else {
            echo "  - Skipped: No barangay_id or schedule could not be created\n";
        }
    }
    
    // Commit transaction
    $db->commit();
    
    echo "\nMigration completed successfully!\n";
    echo "You can now safely drop the old tables if needed:\n";
    echo "DROP TABLE assignment_collector;\n";
    echo "DROP TABLE assignment;\n";
    
} catch (Exception $e) {
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?> 
