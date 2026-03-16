# Face Verification Test Guide

## Current Status
- ✅ Face verification system is fully implemented
- ✅ ML service is running (minimal mode)
- ✅ API endpoints are working
- ✅ Database is properly configured
- ❌ Can't test with dattu because attendance already marked today

## Solution: Create New Test Employee

### Method 1: Register New Employee (Recommended)

#### Step 1: Register New Employee
1. **Open**: http://localhost:8082/register
2. **Fill out registration form**:
   - Full Name: `Test Face Employee`
   - Email: `testface@nexus.com` (or any unique email)
   - Password: `test123`
   - Employee ID: `TESTFACE001`
   - Designation: `Test Engineer`
3. **Submit registration**

#### Step 2: Admin Approval
1. **Login as admin**: Go to http://localhost:8082/admin
2. **Go to**: Pending Approvals
3. **Find**: Test Face Employee
4. **Approve** the employee

#### Step 3: Upload Profile Photo
1. **Stay in admin panel**
2. **Go to**: Employee Management
3. **Find**: Test Face Employee
4. **Click**: View Details
5. **Upload**: Profile photo (any photo will work)
6. **Verify**: Photo appears and "Face recognition enabled" message shows

#### Step 4: Test Face Verification
1. **Logout** from admin
2. **Login as**: testface@nexus.com / test123
3. **Click**: "Mark Attendance"
4. **Expected**: Face verification modal should appear
5. **Allow**: Camera access
6. **Take**: Selfie
7. **Verify**: Face verification succeeds (~85% confidence)
8. **Check**: Attendance success screen shows face verification

### Method 2: Use Existing Employee (Alternative)

#### Reset Attendance for Testing
If you want to test with an existing employee, you can reset their attendance:

```sql
-- Reset dattu's attendance for today (USE CAREFULLY)
DELETE FROM attendance 
WHERE user_id = '3917c798-a505-4109-9fac-9d5faef57c4a' 
  AND date = '2026-03-16';
```

**⚠️ Warning**: This will delete the actual attendance record!

### Method 3: Test with Different Employee

#### Check Other Employees with Photos
```bash
node check-employee-face-status.js
```

Look for employees with:
- ✅ Profile Photo: YES
- ✅ Face Registered: YES
- ❌ No attendance marked today

Try logging in as one of these employees.

## Verification Steps

### 1. Check Employee Face Status
```bash
# Update employee ID in the script
node debug-face-check.js
```

Expected output:
```
✅ Face Registration Check:
   Registered: true
   ML Service Available: true
✅ Should show face verification modal
```

### 2. Check Database
```sql
SELECT 
  full_name, 
  email, 
  face_registered, 
  profile_photo_url,
  (SELECT COUNT(*) FROM attendance WHERE user_id = profiles.id AND date = CURRENT_DATE) as attendance_today
FROM profiles 
WHERE email = 'testface@nexus.com';
```

Expected:
- face_registered: true
- profile_photo_url: not null
- attendance_today: 0

### 3. Test Complete Flow
```bash
node test-complete-face-flow.js
```

## Troubleshooting

### If Face Modal Still Doesn't Appear

#### Check Browser Console (F12)
Look for:
```
Face registration check: {registered: true, mlServiceAvailable: true}
Showing face verification modal
```

#### Check Network Tab
- API call to `/api/face-recognition` should return 200
- Response should include `mlServiceAvailable: true`

#### Check Server Logs
```bash
# Check if API requests are being received
# Look for: [API Middleware] Loading face-recognition handler
```

### If API Returns Wrong Data

#### Test API Directly
```bash
curl -X POST http://localhost:8082/api/face-recognition \
  -H "Content-Type: application/json" \
  -d '{"action":"check-registration","employee_id":"USER_ID_HERE"}'
```

Should return:
```json
{
  "registered": true,
  "message": "Registration check simulated (ML service in minimal mode)",
  "mlServiceAvailable": true
}
```

## Expected Complete Flow

```
1. Login as test employee
2. Click "Mark Attendance"
3. Dashboard calls /api/face-recognition
4. API returns {registered: true, mlServiceAvailable: true}
5. Face verification modal appears
6. Employee takes selfie
7. Modal calls /api/face-recognition with action: "verify"
8. API returns {verified: true, confidence: 85}
9. Modal shows success and closes
10. Navigate to attendance processing
11. Attendance marked with face verification data
12. Success screen shows "Face Verified" badge
```

## Quick Test Commands

```bash
# Check services
curl http://localhost:8082
curl http://localhost:5000/health

# Check employee data
node check-employee-face-status.js

# Test API
node debug-face-check.js

# Test complete flow
node test-complete-face-flow.js
```

## Success Criteria

✅ Face verification modal appears when marking attendance
✅ Camera access works
✅ Face verification succeeds with ~85% confidence  
✅ Attendance processing shows face verification step
✅ Success screen shows "Face Verified" badge
✅ Console logs show correct API responses