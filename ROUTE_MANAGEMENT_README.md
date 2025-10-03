# Route Management System

This document explains how the route management system works and how to set it up for real driver and truck assignments.

## Overview

The route management system fetches collection schedules from the `collection_schedule` table with status 'scheduled' and displays them in a user-friendly interface. It includes:

- Real-time route fetching from the database
- Interactive map with route visualization
- Route details and collection points
- Driver and truck assignment management

## Current Implementation

### API Endpoint
- **File**: `backend/api/get_scheduled_routes.php`
- **URL**: `http://localhost/koletrash/backend/api/get_scheduled_routes.php?date=YYYY-MM-DD`
- **Method**: GET
- **Parameters**: 
  - `date`: Date to fetch routes for (defaults to today)

### Data Source
The system currently fetches data from:
1. `collection_schedule` - Main schedule information
2. `barangay` - Barangay details and cluster information
3. `truck` - Available trucks
4. `users` - Available truck drivers

### Current Limitations
- Driver and truck assignments are simulated (round-robin assignment)
- No real-time tracking of actual assignments
- Collection points are generated randomly

## Setup Instructions

### 1. Database Setup
Make sure you have the required tables:

```sql
-- Run the database setup scripts in order:
1. backend/database_setup.sql
2. backend/create_sample_data.sql
3. backend/create_collection_schedule_table.sql
```

### 2. Create Collection Team Table (Optional - for real assignments)
To enable real driver and truck assignments, run:

```sql
-- Run this script to create the collection_team table:
backend/create_collection_team_table.sql
```

### 3. Insert Sample Data
Make sure you have:
- Sample barangays in the `barangay` table
- Sample trucks in the `truck` table
- Users with `user_type = 'truck_driver'` in the `users` table
- Collection schedules in the `collection_schedule` table

## How to Use

### 1. Access Route Management
1. Navigate to the admin dashboard
2. Click on "Route Management" in the sidebar
3. The system will automatically fetch scheduled routes for the current date

### 2. View Routes
- Routes are displayed in a table format
- Each route shows: name, truck, driver, barangay, date/time, volume, and status
- Click on a route row to view detailed information

### 3. Interactive Map
- The map shows all barangays in Sipocot
- Click on a barangay name to center the map on that location
- Select a route to see collection points and route visualization
- Use the "Animate" button to see truck movement simulation

### 4. Filter and Search
- Use the search bar to find specific routes or drivers
- Filter by status, driver, barangay, or date
- Use the date picker to view routes for different dates

### 5. Refresh Data
- Click the "Refresh Routes" button to reload data from the database
- The system automatically refreshes when the date changes

## API Response Format

```json
{
  "success": true,
  "routes": [
    {
      "schedule_id": 1,
      "name": "Zone 1 - Sagrada Familia",
      "truck": "ABC-123",
      "driver": "John Doe",
      "driverPhone": "+63 912 345 6789",
      "barangay": "Sagrada Familia",
      "datetime": "2025-01-20, 09:00 - 12:00",
      "volume": "2.5 tons",
      "status": "Scheduled",
      "coordinates": [13.8142517, 122.9986921],
      "collectionPoints": [...],
      "driverNotes": "",
      "complaints": []
    }
  ],
  "total": 5,
  "message": "Note: Driver and truck assignments are currently simulated..."
}
```

## Future Enhancements

### 1. Real Driver Assignments
To implement real driver assignments:

1. Create the `collection_team` table
2. Modify the API to join with this table
3. Update the frontend to show real assignment data

### 2. Real-time Tracking
- Integrate with GPS tracking system
- Show real-time truck locations
- Update route status automatically

### 3. Route Optimization
- Implement route planning algorithms
- Consider traffic conditions
- Optimize collection sequences

### 4. Mobile App Integration
- Driver mobile app for route updates
- Real-time status updates
- Photo capture for collection verification

## Troubleshooting

### Common Issues

1. **No routes displayed**
   - Check if `collection_schedule` table has data
   - Verify that schedules have status 'scheduled'
   - Check database connection

2. **Map not loading**
   - Ensure internet connection for OpenStreetMap tiles
   - Check if Leaflet CSS and JS are loaded
   - Verify coordinates in `BARANGAY_COORDINATES`

3. **Driver/truck not showing**
   - Check if `truck` table has active trucks
   - Verify that users have `user_type = 'truck_driver'`
   - Check if users are marked as active

### Error Messages

- **"Database error"**: Check database connection and table structure
- **"Failed to fetch scheduled routes"**: Check API endpoint and database
- **"Network error"**: Check backend server and CORS settings

## Database Schema

### Key Tables

1. **collection_schedule**
   - `schedule_id` (Primary Key)
   - `barangay_id` (Foreign Key to barangay)
   - `scheduled_date`
   - `start_time`, `end_time`
   - `status`

2. **barangay**
   - `barangay_id` (Primary Key)
   - `barangay_name`
   - `cluster_id`

3. **truck**
   - `truck_id` (Primary Key)
   - `truck_plate`
   - `truck_type`
   - `status`

4. **users**
   - `id` (Primary Key)
   - `full_name`
   - `user_type`
   - `is_active`

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify database connectivity
3. Check API endpoint accessibility
4. Review database table structure and data

