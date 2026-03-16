# Face Verification Debug Steps

## Current Issue
Face verification modal is not appearing when marking attendance. It goes directly to standard attendance processing.

## What We Fixed
1. ✅ ML Service now returns `encoding_saved: true`
2. ✅ Database updated - employees with photos now have `face_registered = true`
3. ✅ API endpoint now returns `mlServiceAvailable: true`

## Current Problem
Dashboard is importing `attendanceService` from `@server` which tries to use backend service directly in browser, but the `checkFaceRegistration` method needs to make an API call.

## Solution Applied
Updated dashboard to call `/api/face-recognition` directly instead of using backend service.

## Testing Steps

### 1. Test API Directly
```bash
curl -X POST http://localhost:8082/api/face-recognition \
  -H "Content-Type: application/json" \
  -d '{"action":"check-registration","employee_id":"3917c798-a505-4109-9fac-9d5faef57c4a"}'
```

Expected response:
```json
{
  "registered": true,
  "message": "Registration check simulated (ML service in minimal mode)",
  "mlServiceAvailable": true
}
```

### 2. Test in Browser
1. Open http://localhost:8082
2. Login as dattu@nexus.com
3. Open browser console (F12)
4. Click "Mark Attendance"
5. Check console logs for:
   - "Face registration check: {registered: true, mlServiceAvailable: true}"
   - "Showing face verification modal"

### 3. Expected Flow
```
Click "Mark Attendance" 
→ API call to /api/face-recognition 
→ Response: {registered: true, mlServiceAvailable: true}
→ Console: "Showing face verification modal"
→ Face verification modal appears
→ Take selfie
→ Face verification succeeds
→ Navigate to attendance processing
```

## Debug Commands

### Check if services are running:
```bash
# Check frontend
curl http://localhost:8082

# Check ML service  
curl http://localhost:5000/health
```

### Check database:
```bash
node check-employee-face-status.js
```

### Test complete flow:
```bash
node test-complete-face-flow.js
```

## If Still Not Working

### Check browser console for:
1. Network errors on `/api/face-recognition` call
2. JavaScript errors in dashboard
3. Console logs showing the API response

### Check server logs for:
1. API requests being received
2. Any errors in face recognition API
3. ML service communication

### Verify employee data:
```sql
SELECT id, full_name, email, face_registered, profile_photo_url 
FROM profiles 
WHERE email = 'dattu@nexus.com';
```

Should show:
- face_registered: true
- profile_photo_url: not null