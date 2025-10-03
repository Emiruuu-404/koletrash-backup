# Garbage Collector Settings - Implementation Guide

## Overview
This document explains how to update garbage collector details using the settings functionality in the frontend.

## Features Implemented

### 1. Profile Management
- **Full Name**: Update collector's full name
- **Email**: Update email address
- **Phone Number**: Update contact number
- **Employee ID**: Update collector's employee ID
- **Assigned Area**: Update the area assigned to the collector

### 2. Security
- **Password Change**: Change account password with current password verification

### 3. Notifications
- **Email Notifications**: Toggle email notifications
- **Push Notifications**: Toggle push notifications
- **Task Updates**: Toggle task update notifications
- **Schedule Changes**: Toggle schedule change notifications
- **Safety Alerts**: Toggle safety alert notifications
- **Special Collections**: Toggle special collection notifications

## Backend APIs

### 1. Get Garbage Collector Data
- **Endpoint**: `GET /backend/api/get_garbage_collector.php?id={user_id}`
- **Purpose**: Retrieve garbage collector profile information
- **Response**: Combined user and garbage collector data

### 2. Update Garbage Collector Profile
- **Endpoint**: `POST /backend/api/update_garbage_collector.php`
- **Purpose**: Update garbage collector profile information
- **Request Body**:
  ```json
  {
    "id": "user_id",
    "fullName": "Updated Name",
    "email": "updated@email.com",
    "phone": "09123456789",
    "employeeId": "GC-123456",
    "assignedArea": "Brgy. Looc"
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

### Garbage Collectors Table
```sql
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
);
```

## Frontend Implementation

### Component: GarbageCollectorSettings.jsx
- **Location**: `src/components/garbagecollector/GarbageCollectorSettings.jsx`
- **Features**:
  - Load user data on component mount
  - Form validation
  - Real-time error handling
  - Success/error notifications
  - Confirmation modals for actions

### Service: garbageCollectorService.js
- **Location**: `src/services/garbageCollectorService.js`
- **Methods**:
  - `getGarbageCollector(userId)`: Fetch garbage collector data
  - `updateGarbageCollector(updateData)`: Update garbage collector profile
  - `changePassword(passwordData)`: Change password

## How to Use

### 1. Access Settings
1. Login as a garbage collector
2. Navigate to the garbage collector dashboard
3. Click on "Settings" in the navigation menu

### 2. Update Profile
1. Fill in the desired fields in the "Profile Information" section
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
1. Toggle the switches in the "Notification Settings" section
2. Changes are saved automatically

## Test Credentials

### Garbage Collector Test Account
- **Username**: `collector1`
- **Password**: `collector123`
- **Email**: `collector@koletrash.com`

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

## Field Descriptions

### Profile Fields
- **Full Name**: The collector's complete name
- **Email**: Contact email address
- **Phone Number**: Contact phone number
- **Employee ID**: Unique identifier for the collector (e.g., GC-123456)
- **Assigned Area**: The barangay or area assigned to the collector

### Notification Types
- **Email Notifications**: Receive updates via email
- **Push Notifications**: Receive mobile push notifications
- **Task Updates**: Notifications about new tasks or task changes
- **Schedule Changes**: Notifications about collection schedule updates
- **Safety Alerts**: Important safety and emergency notifications
- **Special Collections**: Notifications about special collection requests

## Future Enhancements

1. **Profile Picture Upload**: Add ability to upload profile pictures
2. **Two-Factor Authentication**: Implement 2FA for enhanced security
3. **Activity Log**: Track profile changes and login history
4. **Email Verification**: Require email verification for changes
5. **Mobile App**: Develop mobile app for garbage collectors
6. **Work Schedule Management**: Allow collectors to view and update their work schedules
7. **Equipment Assignment**: Track equipment assigned to collectors
8. **Performance Metrics**: Display collection performance statistics 