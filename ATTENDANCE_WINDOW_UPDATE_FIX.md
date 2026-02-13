# Attendance Window Update Fix

## Issue
Attendance window time was not being saved to the database when updated from the admin settings page. After reload, the old time was showing.

## Root Cause
The `updateWindow` function was receiving time in `HH:MM:SS` format from the screen (which was already adding `:00`), but the function was trying to add `:00` again, causing a format mismatch.

## Solution

### 1. Fixed `updateWindow` Function
- Removed the duplicate `:00` addition
- Function now expects `HH:MM:SS` format directly
- Added comprehensive logging to track updates

### 2. Added `getAttendanceWindow` Method
- New method specifically for fetching window for display
- Returns formatted time strings
- Used by settings page to show current window

### 3. Enhanced Logging
Added console logs to track:
- Window fetch operations
- Update operations
- Time format conversions
- Success/failure states

## Testing Steps

1. **Update Window**:
   ```
   - Go to Admin Settings → Attendance Window
   - Change start/end time
   - Click "Save Changes"
   - Check browser console for logs
   ```

2. **Verify Update**:
   ```
   - Reload the page
   - Check if new times are displayed
   - Go to employee dashboard
   - Verify window status reflects new times
   ```

3. **Check Database**:
   ```sql
   SELECT * FROM attendance_settings 
   WHERE setting_name = 'default_attendance_window';
   ```

## Console Logs to Watch

### On Update:
```
🔄 [UPDATE WINDOW] Updating attendance window...
  Start time: 09:00:00
  End time: 18:00:00
  Admin ID: xxx-xxx-xxx
  ✅ Window updated successfully
```

### On Fetch:
```
🔍 [GET ACTIVE WINDOW] Fetching from database...
  📊 Query result - data: {...}
  ✅ Window fetched successfully: { start: '09:00:00', end: '18:00:00', active: true }
```

### On Window Check (Employee Side):
```
🔍 [ATTENDANCE WINDOW CHECK]
  Database window: {...}
  ⏰ Current IST time: 10:30
  📅 Window start: 09:00 (540 min)
  📅 Window end: 18:00 (1080 min)
  ✅ Window is open: true
```

## Files Modified

1. `server/services/attendance-settings.service.ts`
   - Fixed `updateWindow()` to accept HH:MM:SS format
   - Added `getAttendanceWindow()` for display
   - Enhanced logging throughout

2. `src/pages/admin/settings/AttendanceWindowScreen.tsx`
   - Already correctly converting HH:MM to HH:MM:SS
   - No changes needed

## Verification Checklist

- [ ] Admin can update attendance window
- [ ] Updated time persists after page reload
- [ ] Employee dashboard shows correct window status
- [ ] Window open/closed logic works with new times
- [ ] Console logs show successful update
- [ ] Database contains updated times

## Common Issues

### Issue: Times not updating
**Solution**: Check browser console for error logs. Verify admin user ID is being passed correctly.

### Issue: Old times showing after update
**Solution**: Hard refresh the page (Ctrl+Shift+R). Check if database was actually updated.

### Issue: Window status not reflecting on employee side
**Solution**: Employee dashboard caches window status. Reload employee dashboard to fetch fresh data.

## Database Schema Reference

```sql
CREATE TABLE attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,  -- HH:MM:SS format
  end_time TIME NOT NULL,    -- HH:MM:SS format
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Next Steps

If the issue persists:
1. Check browser console for error messages
2. Verify Supabase RLS policies allow updates
3. Confirm admin user has proper permissions
4. Check network tab for failed API calls
