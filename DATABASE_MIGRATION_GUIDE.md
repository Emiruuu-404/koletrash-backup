# KOLETRASH Database Migration - Users vs Employees

## Overview

This migration separates the single `users` table into two distinct tables:
- **`users`** - For residents/citizens who use the garbage collection service
- **`employees`** - For MENRO staff and barangay officials (admin, truck drivers, garbage collectors, barangay heads)

## Benefits

1. **Better Security**: Different authentication rules for residents vs employees
2. **Cleaner Data Model**: Separate concerns between service users and staff
3. **Scalability**: Easier to add employee-specific features
4. **Role Management**: Better permission control and hierarchy

## New Database Structure

### Users Table (Residents)
```sql
- id (Primary Key)
- username (Unique)
- password
- email (Unique)
- fullName
- phone
- address
- barangay
- is_active
- email_verified
- created/updated timestamps
```

### Employees Table (MENRO Staff & Barangay Officials)
```sql
- id (Primary Key)
- employee_id (Unique - e.g., GC-001, TD-001)
- username (Unique)
- password
- email (Unique)
- fullName
- role (admin, barangayhead, truckdriver, garbagecollector)
- phone
- assignedArea
- department
- employment_date
- supervisor_id (Self-referencing)
- status (active, inactive, suspended)
- last_login
- created/updated timestamps
```

### Additional Profile Tables
- **`garbage_collectors`** - Vehicle, route, shift info
- **`truck_drivers`** - License, vehicles, routes
- **`barangay_heads`** - Barangay assignment, term dates

## Migration Steps

### 1. Backup Current Database
```sql
CREATE TABLE users_backup AS SELECT * FROM users;
```

### 2. Run New Database Structure
```bash
mysql -u root -p koletrash_db < backend/database/koletrash_db_new.sql
```

### 3. Run Migration Script
```bash
php backend/database/migrate.php
```

### 4. Update API Files
Replace the old API files with the new ones:
- `login.php` → `login_new.php`
- Add new endpoints: `register_resident.php`, `get_resident.php`, `get_employee.php`

### 5. Update Frontend Services
Replace `authService.js` with `authService_new.js` which includes:
- Separate methods for residents and employees
- Backward compatibility with legacy methods
- User type detection

## API Changes

### Login (Unified)
```javascript
// Works for both residents and employees
authService.login({username, password})
```

### Registration
```javascript
// For residents only
authService.signupResident({username, password, email, fullName, barangay})
```

### Data Retrieval
```javascript
// For residents
authService.getResidentData(userId)

// For employees
authService.getEmployeeData(employeeId)

// Legacy method (auto-detects type)
authService.getUserData(id)
```

## User Type Detection

The system now stores `userType` in localStorage:
- `"resident"` - For regular citizens
- `"employee"` - For MENRO staff and barangay officials

## Testing the Migration

### Test Accounts (After Migration)

**Residents:**
- Username: `resident1` / Password: `password`
- Username: `resident2` / Password: `password`

**Employees:**
- Admin: `admin` / `password`
- Barangay Head: `barangayhead1` / `password`
- Truck Driver: `driver1` / `password`
- Garbage Collector: `collector1` / `password`

### Verification Steps

1. **Login Test**: Try logging in with both resident and employee accounts
2. **Data Retrieval**: Check if user data loads correctly for both types
3. **Role-based Features**: Verify role-specific functionality works
4. **Foreign Keys**: Check if schedules, tasks, and notifications still work

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Drop new tables
DROP TABLE garbage_collectors, truck_drivers, barangay_heads, employees;

-- Restore original users table
DROP TABLE users;
RENAME TABLE users_backup TO users;

-- Restore original API files
```

## Frontend Updates Needed

1. Update login flow to handle user type detection
2. Update profile components to use appropriate API endpoints
3. Update dashboard components to show role-specific data
4. Update navigation based on user type (resident vs employee)

## Future Enhancements

With this new structure, you can easily add:
- Employee hierarchy and supervision
- Department-based permissions
- Employee performance tracking
- Resident feedback and ratings
- Advanced role-based access control
- Employee scheduling and shift management
