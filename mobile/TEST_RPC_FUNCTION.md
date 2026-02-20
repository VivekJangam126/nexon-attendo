# Testing RPC Function

## Issue
Attendance marking shows "Success!" message but doesn't actually save to database.

## Possible Causes

1. **RPC Function Not Created**: The `mark_attendance` function might not exist in Supabase
2. **Wrong Response Format**: The function returns JSON but we're not parsing it correctly
3. **Permission Issues**: The function might not have proper permissions
4. **Database Error**: The function might be failing silently

## How to Check

### 1. Verify RPC Function Exists

Run this in Supabase SQL Editor:

```sql
-- Check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'mark_attendance'
AND routine_schema = 'public';
```

If it returns no rows, the function doesn't exist. You need to run `mobile/BACKEND_INTEGRATION.sql`.

### 2. Test the Function Directly

Replace `YOUR_USER_ID` with an actual user ID from your profiles table:

```sql
-- Test the function
SELECT mark_attendance(
  'YOUR_USER_ID'::UUID,
  28.6139,  -- latitude (example: Delhi)
  77.2090,  -- longitude (example: Delhi)
  'test-device-id',
  'Nexus-Attendo-Mobile/1.0.0'
);
```

Expected response:
```json
{
  "success": true,
  "attendance": {
    "id": "...",
    "user_id": "...",
    "date": "2026-02-20",
    "check_in_time": "...",
    "status": "present",
    "office_id": "..."
  }
}
```

### 3. Check Console Logs

When marking attendance in the app, check the Metro console for these logs:

```
✅ Marking attendance...
  User: user@example.com
  Location: 28.6139 77.2090
  Device: device-id-here
  📦 RPC Response: { data: {...}, error: null }
  ✅ Attendance marked successfully
```

If you see:
- `❌ RPC Error:` - The function doesn't exist or has permission issues
- `❌ Function returned error:` - The function ran but validation failed
- `⚠️ Unexpected response format:` - The function returned something unexpected

## Fix Steps

### If Function Doesn't Exist:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire content from `mobile/BACKEND_INTEGRATION.sql`
4. Run the SQL
5. Verify with the check query above

### If Function Exists But Fails:

Check the error message in console logs. Common issues:

- **"Attendance window is closed"**: Check attendance_settings table
- **"No office assigned"**: User profile needs office_location
- **"Outside office premises"**: GPS coordinates too far from office
- **"Attendance already marked"**: Already marked for today

### If Success Shows But No Data:

This means the function is returning `{ success: true }` but not actually inserting.
Check the function code for transaction issues.

## Updated Code

The attendance service now properly handles the JSON response:

```typescript
// The RPC function returns a JSON object
if (data && typeof data === 'object') {
  if (data.success === false) {
    // Function returned an error
    return {
      success: false,
      error: data.error,
      errorCode: data.errorCode,
    };
  }
  
  if (data.success === true) {
    // Function succeeded
    return {
      success: true,
      attendance: data.attendance,
    };
  }
}
```

## Next Steps

1. Check if RPC function exists (query above)
2. If not, run `mobile/BACKEND_INTEGRATION.sql`
3. Test the function directly in SQL Editor
4. Try marking attendance in app
5. Check console logs for detailed error messages
