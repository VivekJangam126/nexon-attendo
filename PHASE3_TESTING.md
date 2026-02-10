# Phase 3: Attendance Marking - Testing Guide

## Prerequisites

Before running tests, ensure:

1. ✅ Database setup complete (run `COMPLETE_DATABASE_SETUP.sql` in Supabase)
2. ✅ Admin user created with email: `admin@nexon.com`, password: `admin123`
3. ✅ Admin profile exists in `profiles` table with `role='admin'` and `status='active'`
4. ✅ Environment variables configured in `.env` file

## Running the Test Script

```bash
npm run test:phase3
```

## What the Test Script Does

The script automatically tests all Phase 3 validation rules:

### Test 1: Active Employee ✅
- Creates an active employee
- Marks attendance
- **Expected**: Success (if within time window)

### Test 2: Duplicate Attendance ❌
- Attempts to mark attendance again on same day
- **Expected**: Blocked with error `ATTENDANCE_ALREADY_MARKED`

### Test 3: Pending User ❌
- Creates a pending (unapproved) employee
- Attempts to mark attendance
- **Expected**: Blocked with error `ACCOUNT_NOT_ACTIVE`

### Test 4: Admin User ❌
- Admin attempts to mark attendance
- **Expected**: Blocked with error `NOT_EMPLOYEE`

### Test 5: Get Today's Attendance ✅
- Retrieves today's attendance record
- **Expected**: Returns attendance if marked

### Test 6: Get Attendance History ✅
- Retrieves attendance history (last 30 days)
- **Expected**: Returns array of attendance records

## Time Window Consideration

⚠️ **IMPORTANT**: Attendance can only be marked between **09:30 AM - 11:30 AM IST**

- If you run tests **inside** the window → Test 1 should succeed
- If you run tests **outside** the window → Test 1 will fail with `OUTSIDE_TIME_WINDOW` (expected)

The test script will detect and inform you about the current time window status.

## Manual Testing with Postman

If you prefer manual testing, use these endpoints:

### 1. Login as Active Employee
```http
POST {{SUPABASE_URL}}/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "employee@nexon.com",
  "password": "password123"
}
```

### 2. Mark Attendance
```typescript
// In your app code:
import { attendanceService, profileService } from '@server';

const { profile } = await profileService.getProfile(userId);
const result = await attendanceService.markAttendance(profile);

console.log(result);
```

### 3. Get Today's Attendance
```typescript
const { attendance } = await attendanceService.getTodayAttendance(profile);
console.log(attendance);
```

### 4. Get Attendance History
```typescript
const { attendance: history } = await attendanceService.getAttendanceHistory(profile, 30);
console.log(history);
```

## Expected Test Results

When running between **09:30-11:30 IST**:

```
📊 Test Results:
   Test 1: Active Employee          → ✅ PASS
   Test 2: Duplicate Blocked        → ✅ PASS
   Test 3: Pending User Blocked     → ✅ PASS
   Test 4: Admin Blocked            → ✅ PASS
   Test 5: Get Today's Attendance   → ✅ PASS
   Test 6: Get History              → ✅ PASS
```

When running **outside** the time window:

```
📊 Test Results:
   Test 1: Active Employee          → ✅ PASS (blocked as expected)
   Test 2: Duplicate Blocked        → ✅ PASS
   Test 3: Pending User Blocked     → ✅ PASS
   Test 4: Admin Blocked            → ✅ PASS
   Test 5: Get Today's Attendance   → ✅ PASS (no attendance)
   Test 6: Get History              → ✅ PASS
```

## Validation Rules Tested

The test script verifies all validation rules in order:

1. ✅ User is authenticated
2. ✅ User role = employee (not admin)
3. ✅ User status = active (not pending/rejected/blocked)
4. ✅ User has office_id assigned
5. ✅ Current time is within window (09:30-11:30 IST)
6. ✅ Attendance not already marked today

## Error Codes

| Error Code | Description |
|------------|-------------|
| `UNAUTHORIZED` | User not authenticated |
| `NOT_EMPLOYEE` | User is admin, cannot mark attendance |
| `ACCOUNT_NOT_ACTIVE` | User status is pending/rejected/blocked |
| `NO_OFFICE_ASSIGNED` | User has no office_id |
| `OUTSIDE_TIME_WINDOW` | Current time not in 09:30-11:30 IST |
| `ATTENDANCE_ALREADY_MARKED` | Attendance already exists for today |
| `VALIDATION_FAILED` | Database or other error |

## Troubleshooting

### Test fails with "Admin login failed"
- Create admin user in Supabase Auth
- Add admin profile to `profiles` table
- Ensure email is `admin@nexon.com` and password is `admin123`

### Test fails with "No offices found"
- Run `COMPLETE_DATABASE_SETUP.sql` in Supabase SQL Editor
- Verify offices table has data

### Test fails with connection error
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is running

### All tests pass but attendance not marked
- Check if you're within the time window (09:30-11:30 IST)
- Verify server time is in IST timezone

## Cleanup

The test script automatically cleans up test data:
- Deletes test employees created during testing
- Keeps admin user intact
- Attendance records remain for history

To manually clean up:
```sql
-- Delete test employees
DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%pending%';
DELETE FROM attendance WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%' OR email LIKE '%pending%'
);
```

## Phase 3 Completion Checklist

- [ ] All 6 tests pass
- [ ] Attendance marked successfully (within window)
- [ ] Duplicate attendance blocked
- [ ] Pending users blocked
- [ ] Admins blocked
- [ ] Today's attendance retrieved
- [ ] Attendance history retrieved
- [ ] Time window validation works
- [ ] Server-side timestamp used
- [ ] RLS policies enforced

If all items checked → **Phase 3 is complete!** ✅

## Next Steps

After Phase 3 passes:
1. Frontend integration (connect UI to backend)
2. Phase 4: Advanced features (GPS, WiFi, reports)
3. Production deployment

---

**Last Updated**: February 10, 2026  
**Phase**: 3 - Attendance Marking  
**Status**: Testing
