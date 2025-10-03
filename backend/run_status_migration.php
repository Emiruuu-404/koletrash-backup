<?php
/**
 * Script to add status field to users table
 * Run this script once to add the status field for tracking staff duty status
 */

require_once("config/database.php");

try {
    $conn = (new Database())->connect();
    
    echo "Starting database migration...\n";
    
    // Check if status column already exists
    $checkColumn = $conn->query("SHOW COLUMNS FROM user LIKE 'status'");
    if ($checkColumn->rowCount() > 0) {
        echo "Status column already exists. Migration not needed.\n";
        exit;
    }
    
    // Add status field to user table
    $sql = "ALTER TABLE user 
            ADD COLUMN status ENUM('On Duty', 'Off Duty', 'On Leave') NULL DEFAULT NULL 
            AFTER role_id";
    
    $conn->exec($sql);
    echo "✓ Added status column to user table\n";
    
    // Add index for better performance
    $sql = "ALTER TABLE user ADD INDEX idx_status (status)";
    $conn->exec($sql);
    echo "✓ Added index for status column\n";
    
    // Update existing staff members to have 'Off Duty' as default status
    $sql = "UPDATE user u
            JOIN role r ON u.role_id = r.role_id
            SET u.status = 'Off Duty' 
            WHERE r.role_name IN ('truck_driver', 'garbage_collector')";
    
    $result = $conn->exec($sql);
    echo "✓ Updated " . $result . " staff members to 'Off Duty' status\n";
    
    // For non-staff users, status remains NULL (which is correct)
    echo "✓ Non-staff users (residents, barangay heads, admin) have NULL status (correct)\n";
    
    echo "\nMigration completed successfully!\n";
    echo "Staff members can now have their status tracked as On Duty, Off Duty, or On Leave.\n";
    
} catch (Exception $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
    exit(1);
}
?>
