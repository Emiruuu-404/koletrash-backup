# Assignment Table Migration Guide

## Overview
This guide explains how to replace the problematic `assignment` and `assignment_collector` tables with the new `collection_team` and `collection_team_member` tables.

## Problems with Old Tables
1. **Complex data structure**: Mixed barangay-specific and cluster-specific assignments
2. **Inconsistent foreign key relationships**: References both `barangay_id` and `cluster_id`
3. **Poor data normalization**: Tightly coupled assignment_collector table
4. **Status tracking issues**: Status stored in multiple places
5. **Notification complexity**: JSON-based notifications

## New Table Structure

### collection_team
```sql
CREATE TABLE collection_team (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT,
    truck_id INT,
    driver_id INT,
    status VARCHAR(50),
    FOREIGN KEY (schedule_id) REFERENCES collection_schedule(schedule_id),
    FOREIGN KEY (truck_id) REFERENCES truck(truck_id),
    FOREIGN KEY (driver_id) REFERENCES user(user_id)
);
```

### collection_team_member
```sql
CREATE TABLE collection_team_member (
    team_member_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    collector_id INT,
    response_status VARCHAR(50),
    FOREIGN KEY (team_id) REFERENCES collection_team(team_id),
    FOREIGN KEY (collector_id) REFERENCES user(user_id)
);
```

## Changes Made

### 1. Updated API Files

#### `get_all_task_assignments.php`
- **Before**: Queried `assignment` and `assignment_collector` tables
- **After**: Queries `collection_team`, `collection_team_member`, `collection_schedule`, `barangay`, `truck`, and `user` tables
- **Benefits**: Cleaner joins, better data structure, consistent relationships

#### `assign_task.php`
- **Before**: Inserted into `assignment` and `assignment_collector` tables
- **After**: Creates `collection_schedule` if needed, then inserts into `collection_team` and `collection_team_member`
- **Benefits**: Better schedule management, cleaner data flow

#### `delete_assignment.php`
- **Before**: Deleted from `assignment_collector` then `assignment`
- **After**: Deletes from `collection_team_member` then `collection_team`
- **Benefits**: Consistent deletion order, better referential integrity

#### `respond_assignment.php`
- **Before**: Updated `assignment_collector` or `assignment` tables
- **After**: Updates `collection_team_member` or `collection_team` tables
- **Benefits**: Cleaner status management, better data consistency

### 2. Migration Script
Created `migrate_to_collection_team.php` to help transition existing data:
- Migrates existing assignments to new structure
- Preserves all relationships and statuses
- Handles schedule creation automatically
- Provides rollback safety

## Implementation Steps

### Step 1: Backup Database
```bash
mysqldump -u root -p kolektrash_db > backup_before_migration.sql
```

### Step 2: Run Migration Script
```bash
cd backend
php migrate_to_collection_team.php
```

### Step 3: Test New Structure
1. Test assignment creation
2. Test assignment retrieval
3. Test assignment deletion
4. Test response handling

### Step 4: Update Frontend (if needed)
The frontend should work without changes since API responses maintain the same format.

### Step 5: Clean Up (Optional)
After confirming everything works:
```sql
DROP TABLE assignment_collector;
DROP TABLE assignment;
```

## Benefits of New Structure

1. **Better Normalization**: Clear separation of concerns
2. **Consistent Relationships**: All foreign keys properly defined
3. **Improved Performance**: Better indexing and query optimization
4. **Easier Maintenance**: Simpler data structure
5. **Future-Proof**: Easier to extend and modify

## API Response Format
The API responses maintain the same format for backward compatibility:

```json
{
  "success": true,
  "assignments": [
    {
      "assignment_id": 1,
      "barangay_id": "B001",
      "barangay_name": "Barangay 1",
      "date": "2024-01-15",
      "time": "08:00:00",
      "driver": {
        "id": 1,
        "name": "Driver Name",
        "status": "accepted"
      },
      "collectors": [
        {
          "id": 2,
          "name": "Collector 1",
          "status": "accepted"
        }
      ],
      "truck_plate": "ABC123",
      "truck_type": "Dump Truck",
      "truck_capacity": "5000",
      "status": "accepted"
    }
  ]
}
```

## Troubleshooting

### Common Issues
1. **Foreign Key Errors**: Ensure all referenced tables exist
2. **Data Type Mismatches**: Check field types match between old and new tables
3. **Missing Data**: Verify all required fields are populated

### Rollback Plan
If issues occur, restore from backup:
```bash
mysql -u root -p kolektrash_db < backup_before_migration.sql
```

## Support
For issues or questions, check:
1. Database logs for errors
2. API response messages
3. Migration script output
4. Frontend console errors 