# Special Pick-up Request Backend API Documentation

This document describes the backend API endpoints for the special pick-up request functionality for barangay heads in the KolekTrash application.

## Overview

The special pick-up request system allows barangay heads to submit requests for special waste collection services, with admin management capabilities for scheduling, approval, and tracking.

## Database Schema

### pickup_requests Table

```sql
CREATE TABLE pickup_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    barangay VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    pickup_date DATE NOT NULL,
    waste_type VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    status ENUM('pending', 'scheduled', 'completed', 'declined') DEFAULT 'pending',
    scheduled_date DATE NULL,
    completed_date DATE NULL,
    declined_reason TEXT NULL,
    admin_remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    processed_by INT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    location_lat DECIMAL(10, 8) NULL,
    location_lng DECIMAL(11, 8) NULL,
    INDEX idx_requester_id (requester_id),
    INDEX idx_status (status),
    INDEX idx_pickup_date (pickup_date),
    INDEX idx_barangay (barangay),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API Endpoints

### 1. Submit Pick-up Request

**Endpoint:** `POST /backend/api/submit_pickup_request.php`

**Description:** Submit a new special pick-up request from a barangay head.

**Request Format:** `application/json`

**Parameters:**
- `requester_id` (required): ID of the barangay head submitting the request
- `requester_name` (optional): Name of the requester (auto-fetched if not provided)
- `barangay` (optional): Barangay name (auto-fetched if not provided)
- `contact_number` (required): Contact number (format: 09XXXXXXXXX)
- `pickup_date` (required): Preferred pickup date (YYYY-MM-DD)
- `waste_type` (required): Type of waste to be collected
- `notes` (optional): Additional notes or details

**Response:**
```json
{
    "status": "success",
    "message": "Pickup request submitted successfully",
    "data": {
        "request_id": 123,
        "status": "pending"
    }
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "Missing required fields: requester_id, contact_number, pickup_date, waste_type"
}
```

### 2. Get Pick-up Requests

**Endpoint:** `GET /backend/api/get_pickup_requests.php`

**Description:** Retrieve pick-up requests with filtering capabilities.

**Parameters:**
- `status` (optional): Filter by status ('pending', 'scheduled', 'completed', 'declined')
- `barangay` (optional): Filter by barangay name
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)
- `requester_id` (optional): Filter by specific requester ID

**Response:**
```json
{
    "status": "success",
    "data": [
        {
            "id": 123,
            "requester_id": 456,
            "requester_name": "Juan Dela Cruz",
            "barangay": "Sagrada Familia",
            "contact_number": "09123456789",
            "pickup_date": "2025-01-30",
            "waste_type": "Bulky Waste",
            "notes": "Old furniture and mattresses",
            "status": "pending",
            "scheduled_date": null,
            "completed_date": null,
            "declined_reason": null,
            "admin_remarks": null,
            "created_at": "2025-01-27 13:30:00",
            "updated_at": "2025-01-27 13:30:00",
            "priority": "medium"
        }
    ],
    "count": 1,
    "statistics": {
        "total": 10,
        "pending": 5,
        "scheduled": 3,
        "completed": 2,
        "declined": 0
    }
}
```

### 3. Update Pick-up Request Status

**Endpoint:** `POST /backend/api/update_pickup_request_status.php`

**Description:** Update the status of a pick-up request (admin only).

**Request Format:** `application/json`

**Parameters:**
- `request_id` (required): ID of the request to update
- `status` (required): New status ('pending', 'scheduled', 'completed', 'declined')
- `scheduled_date` (optional): Scheduled date for pickup (YYYY-MM-DD)
- `admin_remarks` (optional): Admin remarks or notes
- `declined_reason` (optional): Reason for declining the request
- `processed_by` (optional): ID of the admin processing the request
- `priority` (optional): Priority level ('low', 'medium', 'high', 'urgent')

**Response:**
```json
{
    "status": "success",
    "message": "Pickup request status updated successfully",
    "data": {
        "request_id": 123,
        "status": "scheduled",
        "updated_at": "2025-01-27 14:00:00"
    }
}
```

### 4. Create Pick-up Requests Table

**Endpoint:** `POST /backend/api/create_pickup_requests_table.php`

**Description:** Utility endpoint to create the pickup_requests table.

**Response:**
```json
{
    "status": "success",
    "message": "Table pickup_requests created successfully"
}
```

## Validation Rules

### Contact Number Validation
- Must start with "09"
- Must be exactly 11 digits
- Format: 09XXXXXXXXX

### Date Validation
- Pickup date cannot be in the past
- Date format: YYYY-MM-DD

### Status Values
- `pending`: Request submitted, awaiting admin review
- `scheduled`: Request approved and scheduled for pickup
- `completed`: Pickup has been completed
- `declined`: Request has been declined

### Priority Levels
- `low`: Low priority request
- `medium`: Medium priority request (default)
- `high`: High priority request
- `urgent`: Urgent request requiring immediate attention

## Frontend Integration

### Barangay Head Form Submission
```javascript
const requestData = {
    requester_id: userId,
    requester_name: form.name,
    barangay: form.barangay,
    contact_number: form.contact,
    pickup_date: form.date,
    waste_type: form.type,
    notes: form.notes
};

const response = await authService.submitPickupRequest(requestData);
```

### Admin Request Management
```javascript
// Get all requests
const requests = await authService.getPickupRequests();

// Get filtered requests
const filteredRequests = await authService.getPickupRequests({
    status: 'pending',
    barangay: 'Sagrada Familia'
});

// Update request status
const updateResponse = await authService.updatePickupRequestStatus(
    requestId, 
    'scheduled', 
    {
        scheduled_date: '2025-01-30',
        admin_remarks: 'Scheduled for morning pickup',
        processed_by: adminId
    }
);
```

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
- Invalid contact number format
- Past pickup dates
- Database connection errors
- Invalid status or priority values

## Security Features

1. **Input Validation:**
   - Required field validation
   - Contact number format validation
   - Date validation (no past dates)
   - Status and priority validation

2. **Data Sanitization:**
   - SQL injection prevention using prepared statements
   - XSS prevention through proper escaping

3. **Access Control:**
   - Only barangay heads can submit requests
   - Only admins can update request status
   - User data auto-fetching for security

## Usage Examples

### Submit a Pick-up Request
```javascript
const pickupRequest = {
    requester_id: 123,
    contact_number: "09123456789",
    pickup_date: "2025-01-30",
    waste_type: "Bulky Waste",
    notes: "Old furniture and mattresses"
};

try {
    const response = await fetch('/backend/api/submit_pickup_request.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pickupRequest)
    });
    
    const result = await response.json();
    console.log(result);
} catch (error) {
    console.error('Error:', error);
}
```

### Get Requests with Filters
```javascript
const filters = {
    status: 'pending',
    barangay: 'Sagrada Familia',
    date_from: '2025-01-01',
    date_to: '2025-01-31'
};

const response = await fetch(`/backend/api/get_pickup_requests.php?${new URLSearchParams(filters)}`);
const result = await response.json();
```

### Update Request Status
```javascript
const updateData = {
    request_id: 123,
    status: 'scheduled',
    scheduled_date: '2025-01-30',
    admin_remarks: 'Scheduled for morning pickup',
    processed_by: 1
};

const response = await fetch('/backend/api/update_pickup_request_status.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
});
```

## Notes

- All timestamps are in UTC
- The system automatically fetches requester name and barangay from the database if not provided
- Request IDs are auto-generated and unique
- The system logs all request submissions for tracking purposes
- Admin remarks and declined reasons are stored separately for better data organization


