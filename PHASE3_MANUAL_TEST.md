# Phase 3: Manual Testing Guide

Since automated testing requires admin API access to delete users, here's a simple manual testing guide.

## Prerequisites

1. ✅ Run `COMPLETE_DATABASE_SETUP.sql` in Supabase SQL Editor
2. ✅ Create admin user (see below)
3. ✅ Verify time is between 09:30-11:30 IST (or adjust for testing outside window)

## Step 1: Create Admin User

### In Supabase Dashboard:
1. Go to **Authentication** > **Users**
2. Click **Add User**
3. Email: `admin@nexon.com`
4. Password: `admin123`
5. Click **Create User**
6. Copy the User ID

### In Supabase SQL Editor:
```sql
-- Replace USER_ID_HERE with the actual ID from step 6
INSERT INTO profiles (id, email, full_name, role, status, office_location)
VALUES (
  'USER_ID_HERE',
  'admin@nexon.com',
  'Admin User',
  'admin',
  'active',
  (SELECT id FROM offices WHERE name LIKE '%Bangalore%' LIMIT 1)
);
```

## Step 2: Create Test Employee

### In Supabase Dashboard:
1. Go to **Authentication** > **Users**
2. Click **Add User**
3. Email: `employee@nexon.com`
4. Password: `employee123`
5. Click **Create User**
6. Copy the User ID

### In Supabase SQL Editor:
```sql
-- Replace USER_ID_HERE with the actual ID
INSERT INTO profiles (id, email, full_name, role, status, office_location)
VALUES (
  'USER_ID_HERE',
  'employee@nexon.com',
  'Test Employee',
  'employee',
  'active',
  (SELECT id FROM offices WHERE name LIKE '%Bangalore%' LIMIT 1)
);
```

## Step 3: Test Attendance Marking

### Test 1: Active Employee ✅

Open browser console on your app and run:

```javascript
// Import from your server module
import { attendanceService, profileService, supabase } from './server';

// Login as employee
const { data: authData } = await supabase.auth.signInWithPassword({
  email: 'employee@nexon.com',
  password: 'employee123'
});

// Get profile
const { profile } = await profileService.getProfile(authData.user.id);

// Mark attendance
const result = await attendanceService.markAttendance(profile);
console.log(result);

// Expected (if within window):
// { success: true, attendance: { ... } }

// Expected (if outside window):
// { success: false, error: "Attendance can only be marked between 09:30 - 11:30 IST", errorCode: "OUTSIDE_TIME_WINDOW" }
```

### Test 2: Duplicate Attendance ❌

```javascript
// Try marking again (should fail)
const result2 = await attendanceService.markAttendance(profile);
console.log(result2);

// Expected:
// { success: false, error: "Attendance already marked for today", errorCode: "ATTENDANCE_ALREADY_MARKED" }
```

### Test 3: Admin Cannot Mark ❌

```javascript
// Logout
await supabase.auth.signOut();

// Login as admin
const { data: adminAuth } = await supabase.auth.signInWithPassword({
  email: 'admin@nexon.com',
  password: 'admin123'
});

// Get admin profile
const { profile: adminProfile } = await profileService.getProfile(adminAuth.user.id);

// Try to mark attendance
const result3 = await attendanceService.markAttendance(adminProfile);
console.log(result3);

// Expected:
// { success: false, error: "Only employees can mark attendance. Admins cannot mark attendance.", errorCode: "NOT_EMPLOYEE" }
```

### Test 4: Pending User ❌

Create a pending user:

```sql
-- In Supabase SQL Editor
-- First create auth user in Dashboard, then:
INSERT INTO profiles (id, email, full_name, role, status, office_location)
VALUES (
  'PENDING_USER_ID_HERE',
  'pending@nexon.com',
  'Pending Employee',
  'employee',
  'pending',  -- Note: pending status
  (SELECT id FROM offices WHERE name LIKE '%Bangalore%' LIMIT 1)
);
```

Then test:

```javascript
await supabase.auth.signOut();

const { data: pendingAuth } = await supabase.auth.signInWithPassword({
  email: 'pending@nexon.com',
  password: 'pending123'
});

const { profile: pendingProfile } = await profileService.getProfile(pendingAuth.user.id);

const result4 = await attendanceService.markAttendance(pendingProfile);
console.log(result4);

// Expected:
// { success: false, error: "Account status is 'pending'. Only active users can mark attendance.", errorCode: "ACCOUNT_NOT_ACTIVE" }
```

### Test 5: Get Today's Attendance ✅

```javascript
// Login as employee again
const { data: empAuth } = await supabase.auth.signInWithPassword({
  email: 'employee@nexon.com',
  password: 'employee123'
});

const { profile: empProfile } = await profileService.getProfile(empAuth.user.id);

// Get today's attendance
const { attendance, error } = await attendanceService.getTodayAttendance(empProfile);
console.log(attendance);

// Expected (if marked):
// { id: "...", user_id: "...", date: "2026-02-10", check_in_time: "...", status: "present", ... }

// Expected (if not marked):
// null
```

### Test 6: Get Attendance History ✅

```javascript
// Get last 30 days
const { attendance: history, error } = await attendanceService.getAttendanceHistory(empProfile, 30);
console.log(history);

// Expected:
// [ { id: "...", date: "2026-02-10", status: "present", ... }, ... ]
```

## Quick SQL Verification

### Check if attendance was marked:
```sql
SELECT 
  a.date,
  a.check_in_time,
  a.status,
  p.full_name,
  p.email,
  o.name as office_name
FROM attendance a
JOIN profiles p ON a.user_id = p.id
JOIN offices o ON a.office_id = o.id
ORDER BY a.date DESC, a.check_in_time DESC
LIMIT 10;
```

### Check time window status:
```sql
-- Get current IST time
SELECT NOW() AT TIME ZONE 'Asia/Kolkata' as current_ist_time;

-- Check if within window (09:30-11:30)
SELECT 
  EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Kolkata') as current_hour,
  EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'Asia/Kolkata') as current_minute,
  CASE 
    WHEN EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Kolkata') * 60 + 
         EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'Asia/Kolkata') 
         BETWEEN 570 AND 690 
    THEN 'OPEN ✅'
    ELSE 'CLOSED ❌'
  END as window_status;
```

### Delete test attendance (for re-testing):
```sql
-- Delete today's attendance for test employee
DELETE FROM attendance 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'employee@nexon.com')
AND date = CURRENT_DATE;
```

## Test Results Checklist

- [ ] Test 1: Active employee can mark attendance (within window) ✅
- [ ] Test 2: Duplicate attendance blocked ❌
- [ ] Test 3: Admin cannot mark attendance ❌
- [ ] Test 4: Pending user cannot mark attendance ❌
- [ ] Test 5: Can retrieve today's attendance ✅
- [ ] Test 6: Can retrieve attendance history ✅
- [ ] Time window validation works (09:30-11:30 IST) ✅
- [ ] Server timestamp used (not client) ✅
- [ ] RLS policies enforced ✅

## Troubleshooting

### "User not authenticated"
- Make sure you're logged in
- Check `supabase.auth.getSession()`

### "No office assigned"
- Verify profile has `office_location` set
- Check: `SELECT * FROM profiles WHERE email = 'employee@nexon.com'`

### "Outside time window"
- Check current IST time
- Run between 09:30-11:30 IST
- Or temporarily modify `ATTENDANCE_CONFIG` for testing

### "Attendance already marked"
- Delete today's attendance record (see SQL above)
- Or wait until tomorrow

### RLS Policy Error
- Make sure you're logged in as the correct user
- Check policies are created: `SELECT * FROM pg_policies WHERE tablename = 'attendance'`

## Phase 3 Complete! ✅

If all tests pass, Phase 3 backend is complete and ready for frontend integration.

---

**Next Steps:**
1. Frontend integration
2. Phase 4: Advanced features (GPS, WiFi, reports)
3. Production deployment
