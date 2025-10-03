# Truck Driver Settings - Implementation Guide

## Overview
This document explains how to update truck driver details using the settings functionality in the frontend.

## Features Implemented

### 1. Profile Management
- **Full Name**: Update driver's full name
- **Email**: Update email address
- **Phone Number**: Update contact number
- **License Number**: Update driver's license number
- **Assigned Truck**: Update the truck assigned to the driver

### 2. Security
- **Password Change**: Change account password with current password verification

### 3. Notifications
- **Email Notifications**: Toggle email notifications
- **Push Notifications**: Toggle push notifications
- **Route Updates**: Toggle route update notifications
- **Maintenance Reminders**: Toggle maintenance reminder notifications
- **Safety Alerts**: Toggle safety alert notifications
- **Schedule Changes**: Toggle schedule change notifications

## Backend APIs

### 1. Get Truck Driver Data
- **Endpoint**: `GET /backend/api/get_truck_driver.php?id={user_id}`
- **Purpose**: Retrieve truck driver profile information
- **Response**: Combined user and truck driver data

### 2. Update Truck Driver Profile
- **Endpoint**: `POST /backend/api/update_truck_driver.php`
- **Purpose**: Update truck driver profile information
- **Request Body**:
  ```json
  {
    "id": "user_id",
    "fullName": "Updated Name",
    "email": "updated@email.com",
    "phone": "09123456789",
    "licenseNumber": "DL-123456789",
    "truckAssigned": "Truck-001"
  }
  ```

### 3. Change Password
- **Endpoint**: `POST /backend/api/change_password.php`
- **Purpose**: Change user password
- **Request Body**:
  ```json
  {
    "id": "user_id",
    "currentPassword": "current_password",
    "newPassword": "new_password"
  }
  ```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    role ENUM('admin', 'resident', 'barangayhead', 'truckdriver', 'garbagecollector') NOT NULL,
    phone VARCHAR(20),
    assignedArea VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Truck Drivers Table
```sql
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
);
```

## Frontend Implementation

### Component: TruckDriverSettings.jsx
- **Location**: `src/components/truckdriver/TruckDriverSettings.jsx`
- **Features**:
  - Load user data on component mount
  - Form validation
  - Real-time error handling
  - Success/error notifications
  - Confirmation modals for actions

### Service: truckDriverService.js
- **Location**: `src/services/truckDriverService.js`
- **Methods**:
  - `getTruckDriver(userId)`: Fetch truck driver data
  - `updateTruckDriver(updateData)`: Update truck driver profile
  - `changePassword(passwordData)`: Change password

## How to Use

### 1. Access Settings
1. Login as a truck driver
2. Navigate to the truck driver dashboard
3. Click on "Settings" in the navigation menu

### 2. Update Profile
1. Fill in the desired fields in the "Driver Profile" section
2. Click "Update Profile"
3. Confirm the action in the modal
4. Wait for success confirmation

### 3. Change Password
1. Enter current password
2. Enter new password
3. Confirm new password
4. Click "Change Password"
5. Confirm the action in the modal
6. Wait for success confirmation

### 4. Manage Notifications
1. Toggle the switches in the "Notifications" section
2. Changes are saved automatically

## Test Credentials

### Truck Driver Test Account
- **Username**: `truckdriver1`
- **Password**: `driver123`
- **Email**: `driver@koletrash.com`

## Error Handling

### Common Errors
1. **"User data not found"**: User not logged in or session expired
2. **"Passwords do not match"**: New password and confirm password don't match
3. **"Current password is incorrect"**: Wrong current password entered
4. **"Network error"**: Backend server not running or connection issues

### Error Resolution
1. Ensure backend server is running on `http://localhost/koletrash/backend/`
2. Check database connection
3. Verify user is logged in
4. Check browser console for detailed error messages

## Security Features

1. **Password Verification**: Current password required for password changes
2. **Input Validation**: Client-side and server-side validation
3. **Session Management**: User authentication required
4. **SQL Injection Prevention**: Prepared statements used
5. **XSS Prevention**: Input sanitization

## Future Enhancements

1. **Profile Picture Upload**: Add ability to upload profile pictures
2. **Two-Factor Authentication**: Implement 2FA for enhanced security
3. **Activity Log**: Track profile changes and login history
4. **Email Verification**: Require email verification for changes
5. **Mobile App**: Develop mobile app for truck drivers 