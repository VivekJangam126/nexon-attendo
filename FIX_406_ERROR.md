# Fix for 406 (Not Acceptable) Error on Attendance Queries

## Problem
Getting 406 errors when querying the attendance table:
```
GET https://...supabase.co/rest/v1/attendance?select=*&user_id=eq...&date=eq.2026-02-10 406 (Not Acceptable)
```

## Root Cause
The `.single()` method in Supabase expects exactly one row and returns a 406 error when:
- No rows are found (attendance not marked yet)
- Multiple rows are found
- The Accept header doesn't match the response

## Solution Applied

### 1. Changed `.single()` to `.maybeSingle()`

**File**: `server/services/attendance.service.ts`

**Before (Broken)**:
```typescript
const { data, error } = await supabase
  .from('attendance')
  .select('*')
  .eq('user_id', userProfile.id)
  .eq('date', todayDate)
  .single();  // ❌ Returns 406 when no rows

if (error) {
  if (error.code === 'PGRST116') {  // No rows error
    return { attendance: null, error: null };
  }
  return { attendance: null, error: new Error(error.message) };
}
```

**After (Fixed)**:
```typescript
const { data, error } = await supabase
  .from('attendance')
  .select('*')
  .eq('user_id', userProfile.id)
  .eq('date', todayDate)
  .maybeSingle();  // ✅ Returns null when no rows, no error

if (error) {
  return { attendance: null, error: new Error(error.message) };
}

return { attendance: data as Attendance | null, error: null };
```

### 2. Updated Both Methods

Fixed in two places:
- `getTodayAttendance()` - Used by frontend to check if attendance is marked
- `markAttendance()` - Used to check for duplicates before marking

## Why This Works

| Method | Behavior | Use Case |
|--------|----------|----------|
| `.single()` | Expects exactly 1 row, errors if 0 or 2+ | When you know row exists |
| `.maybeSingle()` | Returns null if 0 rows, data if 1 row, errors if 2+ | When row might not exist |

For attendance queries, we **don't know** if attendance is marked yet, so `.maybeSingle()` is correct.

## Additional Fix: RLS Policies

Created `FIX_ATTENDANCE_RLS.sql` to ensure RLS policies are correct:

```sql
-- Users can read their own attendance
CREATE POLICY "enable_read_own_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own attendance
CREATE POLICY "enable_insert_own_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Testing

1. **Build passes**: ✅
   ```bash
   npm run build
   ```

2. **No TypeScript errors**: ✅

3. **Expected behavior**:
   - First load: `getTodayAttendance()` returns `null` (no error)
   - After marking: `getTodayAttendance()` returns attendance record
   - Duplicate attempt: `markAttendance()` detects existing record

## If You Still See 406 Errors

1. **Run the RLS fix**:
   - Open Supabase SQL Editor
   - Run `FIX_ATTENDANCE_RLS.sql`

2. **Clear browser cache**:
   - Ctrl+Shift+Delete
   - Clear cached data

3. **Hard refresh**:
   - Ctrl+Shift+R

4. **Check authentication**:
   - Ensure user is logged in
   - Check browser console for auth errors

5. **Verify RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'attendance';
   ```
   Should show `rowsecurity = true`

## Files Modified

- ✅ `server/services/attendance.service.ts` - Changed `.single()` to `.maybeSingle()`
- ✅ `FIX_ATTENDANCE_RLS.sql` - Created RLS policy fix script
- ✅ `FIX_406_ERROR.md` - This documentation

## Status

**Fixed**: ✅  
**Build**: ✅ Passing  
**Ready**: ✅ For testing

---

**Last Updated**: February 10, 2026  
**Issue**: 406 Not Acceptable on attendance queries  
**Resolution**: Changed `.single()` to `.maybeSingle()`
