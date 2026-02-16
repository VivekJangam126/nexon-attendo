# Grace Period Implementation

## Current Implementation

The grace period feature is **fully implemented** and uses database values (not hardcoded).

### How It Works

1. **Database Settings** (`attendance_settings` table):
   - `start_time`: Window opening time (e.g., "09:00:00")
   - `grace_period_minutes`: Grace period in minutes (e.g., 30)
   - Both values are configurable by admin

2. **Attendance Marking Logic** (`server/services/attendance.service.ts`):
   ```typescript
   // Get window settings from database
   const { window } = await attendanceSettingsService.getActiveWindow();
   
   // Parse start time
   const [startHour, startMinute] = window.start_time.split(':').map(Number);
   const windowStartMinutes = startHour * 60 + startMinute;
   
   // Get grace period from database
   const gracePeriodMinutes = window.grace_period_minutes || 15;
   const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
   
   // Get current IST time
   const checkInTime = getCurrentISTTime();
   const checkInTimeInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
   
   // Determine status
   if (checkInTimeInMinutes <= gracePeriodEndMinutes) {
     status = 'present';
   } else {
     status = 'late';
   }
   ```

3. **Example with Current Settings**:
   - Window start: 09:00 AM
   - Grace period: 30 minutes
   - Grace period ends: 09:30 AM
   
   **Results**:
   - Check-in at 09:15 AM → **Present** ✓
   - Check-in at 09:30 AM → **Present** ✓
   - Check-in at 09:31 AM → **Late** ✓
   - Check-in at 12:00 PM → **Late** ✓

## Current Issue

Some attendance records are incorrectly marked as "present" when they should be "late":
- 12:26 PM IST → marked as present (should be late)
- 2:12 PM IST → marked as present (should be late)
- 3:22 PM IST → marked as present (should be late)

### Possible Causes

1. **Old grace period value**: These records were created when grace period was set to a very large value
2. **Different window start time**: Window start time was different when these records were created
3. **Server timezone issue**: The server's `getCurrentISTTime()` function might not be working correctly

### SQL Fix for Existing Records

```sql
-- Fix all records where check-in IST time is after 9:30 AM
UPDATE attendance 
SET status = 'late',
    updated_at = NOW()
WHERE date = '2026-02-16'
AND status = 'present'
AND (
    EXTRACT(HOUR FROM (check_in_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))::integer * 60 + 
    EXTRACT(MINUTE FROM (check_in_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))::integer
) > 570;  -- 570 minutes = 9:30 AM (9:00 start + 30 min grace)
```

### Debugging New Check-ins

When someone marks attendance, check the server console for logs like:

```
🔍 [MARK ATTENDANCE] Starting validation...
⏰ Late detection calculation (IST):
  Check-in time (IST): 15:22
  Check-in minutes: 922
  Window start (IST): 09:00
  Window start minutes: 540
  Grace period: 30 minutes
  Grace period ends at (IST): 09:30
  Grace period end minutes: 570
  🔍 COMPARISON: 922 <= 570?
  ⚠️  Status: LATE (922 > 570)
```

This will show exactly what values are being used in the calculation.

## Admin Configuration

Admins can change grace period from Settings → Grace Period:
- 5 minutes (Very strict)
- 10 minutes (Strict)
- 15 minutes (Standard)
- 20 minutes (Flexible)
- 30 minutes (Very flexible)

Changes apply to NEW attendance records only. Existing records keep their original status.
