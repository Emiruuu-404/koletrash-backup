# Personnel Schedule Viewing Feature

## Overview
This feature allows truck drivers and garbage collectors to view their schedules only after they have accepted their assigned tasks. The schedule viewing is conditional based on task acceptance status.

## Implementation Details

### 1. API Endpoint
**File:** `backend/api/get_personnel_schedule.php`

**Purpose:** Retrieves schedules for personnel based on their accepted tasks.

**Parameters:**
- `user_id`: The ID of the personnel (driver or collector)
- `role`: Either "driver" or "collector"

**Response:** Returns schedules only for tasks where:
- For drivers: `collection_team.status` is 'accepted' or 'confirmed'
- For collectors: `collection_team_member.response_status` is 'accepted' or 'confirmed'
- And `collection_schedule.status` is 'scheduled' or 'pending' (allows viewing even if collectors haven't accepted yet)

### 2. Frontend Components

#### TruckDriverCollectionSchedule.jsx
- Fetches schedules using the API with `role=driver`
- Shows loading, error, and no-tasks states
- Displays schedules grouped by day of the week
- Shows truck information for each schedule

#### GarbageCollectorSchedule.jsx
- Fetches schedules using the API with `role=collector`
- Shows loading, error, and no-tasks states
- Displays schedules grouped by day of the week
- Shows driver information for each schedule

### 3. Conditional Rendering Logic

The components implement the following conditional rendering:

1. **Loading State:** Shows spinner while fetching data
2. **Error State:** Shows error message with retry button
3. **No Accepted Tasks:** Shows message explaining that tasks must be accepted first
4. **Schedule Display:** Shows actual schedule data when tasks are accepted

### 4. Task Acceptance Flow

1. Admin assigns tasks to personnel
2. Personnel receive notifications about new assignments
3. Personnel accept/decline tasks via the task management interface
4. Once all team members accept, the schedule status changes to 'scheduled'
5. Personnel can then view their schedules in the schedule viewing components

### 5. Database Schema Dependencies

The feature relies on these database tables:
- `collection_schedule`: Stores schedule information
- `collection_team`: Stores team assignments and driver status
- `collection_team_member`: Stores collector assignments and response status
- `barangay`: Stores barangay information
- `truck`: Stores truck information
- `user`: Stores user information

### 6. Security Considerations

- API validates user_id and role parameters
- Only returns schedules for the authenticated user
- Filters results based on acceptance status
- Uses prepared statements to prevent SQL injection

## Usage

1. Personnel log in to their respective dashboards
2. Navigate to the "View Schedule" section
3. If they have accepted tasks, they will see their schedules
4. If they haven't accepted tasks, they will see a message prompting them to accept tasks first
5. Schedules are organized by day of the week with current week dates

## Testing

To test this feature:

1. Create a task assignment for a driver and collector
2. Have the personnel accept their tasks
3. Navigate to the schedule viewing components
4. Verify that schedules are displayed correctly
5. Test with personnel who haven't accepted tasks to ensure the conditional message appears
