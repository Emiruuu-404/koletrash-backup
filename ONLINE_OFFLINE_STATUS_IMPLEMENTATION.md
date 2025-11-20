# Online/Offline Status Implementation Guide

## Overview
Ito ay implementation guide para sa feature na magse-set ng user status bilang "online" kapag nag-login at "offline" kapag nag-logout.

## Database Changes

### 1. Add `online_status` field to `user` table

Run ang SQL file na `add_online_status_field.sql`:

```sql
ALTER TABLE `user` 
ADD COLUMN `online_status` ENUM('online', 'offline') DEFAULT 'offline' AFTER `status`;

UPDATE `user` SET `online_status` = 'offline';
```

**Note:** Ang `status` field ay para sa staff work status ('On Duty', 'Off Duty', 'On Leave'), habang ang `online_status` ay para sa login status ('online', 'offline').

## Backend Changes

### 1. Updated Files

#### `backend/api/login.php`
- Nagse-set ng `online_status = 'online'` kapag successful ang login
- May error handling para sa case na wala pa ang field sa database

#### `backend/api/logout.php` (NEW FILE)
- Bagong API endpoint para sa logout
- Nagse-set ng `online_status = 'offline'` kapag nag-logout
- Pwede makuha ang `user_id` mula sa JWT token o request payload

#### `backend/api/get_all_users.php`
- Na-update para isama ang `online_status` sa response

## Frontend Changes

### 1. Updated Files

#### `src/services/authService.js`
- Nagdagdag ng `logout()` function na tumatawag sa logout API

#### `src/App.jsx`
- Na-update ang `confirmLogout()` para tumawag sa logout API bago mag-clear ng localStorage

#### Dashboard Components
Na-update ang lahat ng logout functions sa:
- `src/components/resident/ResidentDashboard.jsx`
- `src/components/barangayhead/BarangayHeadDashboard.jsx`
- `src/components/garbagecollector/GarbageCollectorDashboard.jsx`
- `src/components/truckdriver/TruckDriverDashboard.jsx`

Lahat ng logout functions ay:
1. Tumatawag sa logout API para mag-set ng `online_status = 'offline'`
2. Nag-clear ng localStorage
3. Nag-redirect sa login page

## How It Works

### Login Flow:
1. User nag-login → `login.php` na-verify ang credentials
2. Kapag successful, `online_status` ay nase-set sa `'online'`
3. JWT token ay na-issue at na-save sa frontend

### Logout Flow:
1. User nag-click ng logout button
2. Frontend tumatawag sa `logout.php` API
3. API nagse-set ng `online_status = 'offline'`
4. Frontend nag-clear ng localStorage at nag-redirect

### Status Checking:
- Ang `get_all_users.php` ay nagre-return na ng `online_status` field
- Pwede mong gamitin ito para i-display ang online/offline status sa UI

## Testing Steps

1. **Run the SQL migration:**
   ```sql
   -- Run add_online_status_field.sql sa database
   ```

2. **Test Login:**
   - Mag-login ng user
   - Check sa database: `SELECT user_id, username, online_status FROM user WHERE username = 'your_username';`
   - Dapat `online_status = 'online'`

3. **Test Logout:**
   - Mag-logout
   - Check sa database ulit
   - Dapat `online_status = 'offline'`

4. **Test Multiple Users:**
   - Mag-login ng multiple users
   - Check kung lahat ay naging 'online'
   - Mag-logout ng isa, dapat maging 'offline' lang yun

## Important Notes

1. **Error Handling:**
   - Kapag nag-fail ang logout API call, hindi ito mag-block ng logout process
   - Ang error ay na-log lang pero tuloy pa rin ang logout

2. **Token Expiration:**
   - Kapag nag-expire ang token, ang user ay hindi automatic na magiging offline
   - Para sa automatic offline on token expiration, kailangan ng additional implementation (session timeout check)

3. **Browser Close:**
   - Kapag nag-close ang browser/tab nang hindi nag-logout, ang user ay mananatiling 'online'
   - Para sa automatic offline on browser close, pwede mong i-add ang `beforeunload` event listener

## Future Enhancements (Optional)

1. **Session Timeout:**
   - Auto-set to offline kapag nag-expire ang token
   - Periodic check ng active sessions

2. **Real-time Status Updates:**
   - WebSocket o polling para sa real-time status updates
   - Live status indicators sa UI

3. **Last Seen Timestamp:**
   - Magdagdag ng `last_seen` timestamp field
   - Track kung kailan huling nag-login ang user

## Files Modified/Created

### Created:
- `add_online_status_field.sql` - Database migration
- `backend/api/logout.php` - Logout API endpoint
- `ONLINE_OFFLINE_STATUS_IMPLEMENTATION.md` - This file

### Modified:
- `backend/api/login.php` - Set online status on login
- `backend/api/get_all_users.php` - Include online_status in response
- `src/services/authService.js` - Add logout function
- `src/App.jsx` - Update logout to call API
- `src/components/resident/ResidentDashboard.jsx` - Update logout
- `src/components/barangayhead/BarangayHeadDashboard.jsx` - Update logout
- `src/components/garbagecollector/GarbageCollectorDashboard.jsx` - Update logout
- `src/components/truckdriver/TruckDriverDashboard.jsx` - Update logout

## Support

Kung may questions o issues, check ang:
- Error logs sa `backend/logs/logout_errors.log`
- Database para sa current status ng users
- Browser console para sa frontend errors

