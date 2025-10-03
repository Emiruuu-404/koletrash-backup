# Issue Report Backend API Documentation

This document describes the backend API endpoints for the issue report functionality in the KolekTrash application.

## Overview

The issue report system allows residents and barangay heads to submit reports about garbage collection issues, with support for photo uploads and status tracking.

## Database Schema

### issue_reports Table

```sql
CREATE TABLE issue_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    barangay VARCHAR(255),
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(500),
    status ENUM('pending', 'active', 'resolved', 'closed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT NULL,
    resolution_notes TEXT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    location_lat DECIMAL(10, 8) NULL,
    location_lng DECIMAL(11, 8) NULL,
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_status (status),
    INDEX idx_issue_type (issue_type),
    INDEX idx_created_at (created_at),
    INDEX idx_barangay (barangay)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API Endpoints

### 1. Submit Issue Report

**Endpoint:** `POST /backend/api/submit_issue_report.php`

**Description:** Submit a new issue report with optional photo upload.

**Request Format:** `multipart/form-data`

**Parameters:**
- `reporter_id` (required): ID of the user submitting the report
- `reporter_name` (optional): Name of the reporter
- `barangay` (optional): Barangay of the reporter
- `issue_type` (required): Type of issue (see valid types below)
- `description` (required): Detailed description of the issue
- `photo` (optional): Image file (JPEG, PNG, GIF, max 5MB)
- `table` (optional): Table name (defaults to 'issue_reports')

**Valid Issue Types:**
- Missed Collection
- Damaged Bin
- Irregular Schedule
- Uncollected Waste
- Overflowing Bins
- Illegal Dumping
- Other

**Response:**
```json
{
    "status": "success",
    "message": "Issue report submitted successfully",
    "data": {
        "issue_id": 123,
        "status": "pending",
        "photo_url": "uploads/issue_reports/issue_123_1234567890_abc123.jpg"
    }
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "Missing required fields: reporter_id, issue_type, description"
}
```

### 2. Get User Issue Reports

**Endpoint:** `GET /backend/api/get_user_issue_reports.php`

**Description:** Retrieve issue reports for a specific user based on their role.

**Parameters:**
- `user_id` (required): ID of the user
- `role` (optional): User role ('Barangay Head' or 'barangay_head' for barangay heads)
- `status` (optional): Filter by status ('active', 'resolved', 'pending', 'closed')

**Response:**
```json
{
    "status": "success",
    "data": [
        {
            "id": 123,
            "name": "John Doe",
            "barangay": "North Centro",
            "issue_type": "Missed Collection",
            "description": "Garbage was not collected on schedule",
            "photo_url": "http://localhost/koletrash/uploads/issue_reports/issue_123_1234567890_abc123.jpg",
            "created_at": "2025-01-27 13:30:00",
            "status": "pending",
            "priority": "medium"
        }
    ],
    "count": 1
}
```

### 3. Update Issue Status

**Endpoint:** `POST /backend/api/update_issue_status.php`

**Description:** Update the status of an issue report (for barangay heads and admins).

**Request Format:** `application/json`

**Parameters:**
- `issue_id` (required): ID of the issue to update
- `status` (required): New status ('pending', 'active', 'resolved', 'closed')
- `resolved_by` (optional): ID of the user resolving the issue
- `resolution_notes` (optional): Notes about the resolution
- `priority` (optional): Priority level ('low', 'medium', 'high', 'urgent')

**Response:**
```json
{
    "status": "success",
    "message": "Issue status updated successfully",
    "data": {
        "issue_id": 123,
        "status": "resolved",
        "updated_at": "2025-01-27 14:00:00"
    }
}
```

### 4. Get All Issues (Admin)

**Endpoint:** `GET /backend/api/get_issues.php`

**Description:** Retrieve all issue reports (for admin users).

**Parameters:**
- `status` (optional): Filter by status ('active', 'resolved')

**Response:**
```json
{
    "status": "success",
    "total_records": 50,
    "filtered_count": 10,
    "data": [
        {
            "id": 123,
            "name": "John Doe",
            "barangay": "North Centro",
            "issue_type": "Missed Collection",
            "description": "Garbage was not collected on schedule",
            "photo_url": "http://localhost/koletrash/uploads/issue_reports/issue_123_1234567890_abc123.jpg",
            "created_at": "2025-01-27 13:30:00",
            "status": "pending"
        }
    ]
}
```

## File Upload

### Upload Directory
- **Path:** `uploads/issue_reports/`
- **Security:** Protected by `.htaccess` to only allow image files
- **Naming Convention:** `issue_{reporter_id}_{timestamp}_{unique_id}.{extension}`

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

### File Size Limit
- Maximum: 5MB per file

## Error Handling

All endpoints return consistent error responses:

```json
{
    "status": "error",
    "message": "Error description"
}
```

Common error scenarios:
- Missing required fields
- Invalid file types or sizes
- Database connection errors
- Invalid user permissions
- File upload failures

## Security Features

1. **File Upload Security:**
   - Only image files allowed
   - File size validation (5MB max)
   - Unique filename generation
   - Directory protection via .htaccess

2. **Input Validation:**
   - Required field validation
   - Issue type validation
   - Status and priority validation

3. **Access Control:**
   - Residents can only see their own reports
   - Barangay heads can see reports from their barangay
   - Admins can see all reports

## Usage Examples

### Frontend Integration

#### Submit Report (Resident/Barangay Head)
```javascript
const formData = new FormData();
formData.append('reporter_id', userId);
formData.append('issue_type', 'Missed Collection');
formData.append('description', 'Garbage was not collected on schedule');
formData.append('photo', photoFile); // File object

const response = await fetch('/backend/api/submit_issue_report.php', {
    method: 'POST',
    body: formData
});

const result = await response.json();
```

#### Get User Reports
```javascript
const response = await fetch(`/backend/api/get_user_issue_reports.php?user_id=${userId}&role=${userRole}`);
const result = await response.json();
```

#### Update Issue Status
```javascript
const response = await fetch('/backend/api/update_issue_status.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        issue_id: 123,
        status: 'resolved',
        resolved_by: adminId,
        resolution_notes: 'Issue has been resolved'
    })
});

const result = await response.json();
```

## Testing

Use the test endpoint to verify backend functionality:
```
GET /backend/api/test_issue_report.php
```

This will check:
- Database table existence
- Table structure
- Upload directory permissions
- File validation settings

## Notes

- All timestamps are in UTC
- Photo URLs are automatically converted to full URLs
- The system logs all issue submissions for tracking
- File uploads are stored in a secure directory with proper access controls


