# GPS-Based Attendance Demo Setup

## 🎯 Office Location

**Coordinates**:
- **Latitude**: 18.5976337
- **Longitude**: 73.8056611
- **Radius**: 100 meters
- **Location**: Pune, Maharashtra, India

---

## 🚀 SETUP STEPS

### Step 1: Run Database Scripts

**Option A: Fresh Installation**
```bash
# Run in Supabase SQL Editor
1. Run: COMPLETE_DATABASE_SETUP.sql
   (Already includes Pune office with correct coordinates)
```

**Option B: Update Existing Installation**
```bash
# Run in Supabase SQL Editor
1. Run: ADD_GPS_WIFI_VERIFICATION.sql
2. Run: SET_OFFICE_GPS_LOCATION.sql
```

### Step 2: Verify Office Configuration

```sql
-- Check office coordinates
SELECT 
  name,
  city,
  latitude,
  longitude,
  radius_meters,
  is_active
FROM offices
WHERE is_active = true;

-- Expected result:
-- name: Nexon Office - Pune
-- latitude: 18.5976337
-- longitude: 73.8056611
-- radius_meters: 100
-- is_active: true
```

### Step 3: Assign Employee to Office

```sql
-- Update employee's office location
UPDATE profiles
SET office_location = (
  SELECT id FROM offices 
  WHERE latitude = 18.5976337 
  AND is_active = true
  LIMIT 1
)
WHERE email = 'your-employee@email.com';
```

---

## 🧪 DEMO SCENARIOS

### Scenario 1: Location Permission Denied ❌

**Steps**:
1. Open app in browser
2. Login as employee
3. Click "Mark Attendance"
4. When browser asks for location → Click **"Block"**

**Expected Result**:
- Error screen: "Location Required"
- Error code: `GPS_REQUIRED`
- Message: "Location permission is required to mark attendance"

**Console Output**:
```
🔍 [MARK ATTENDANCE] Starting validation...
  GPS: undefined undefined
  ❌ GPS coordinates not provided
```

---

### Scenario 2: Far from Office ❌

**Steps**:
1. Allow location permission
2. If you're far from office (>100m from 18.5976337, 73.8056611)
3. Click "Mark Attendance"

**Expected Result**:
- Error screen: "Outside Office Premises"
- Error code: `OUTSIDE_OFFICE_LOCATION`
- Message: "You are not inside office premises. Distance: XXXm (allowed: 100m)"

**Console Output**:
```
🔍 [MARK ATTENDANCE] Starting validation...
  GPS: 18.5200, 73.8500
  
📍 GPS Verification:
  User location: 18.5200, 73.8500
  Office location: 18.5976337, 73.8056611
  Distance: 8642 meters
  Allowed radius: 100 meters
  ❌ User is outside office radius
```

---

### Scenario 3: Near Office ✅

**Steps**:
1. Allow location permission
2. Be within 100m of office (18.5976337, 73.8056611)
3. Click "Mark Attendance"

**Expected Result**:
- Processing screen with animation
- Success screen: "Attendance Marked Successfully"
- Attendance record saved with GPS coordinates

**Console Output**:
```
🔍 [MARK ATTENDANCE] Starting validation...
  User: employee@nexon.com
  GPS: 18.5976337, 73.8056611
  
📍 GPS Verification:
  User location: 18.5976337, 73.8056611
  Office location: 18.5976337, 73.8056611
  Distance: 0 meters
  Allowed radius: 100 meters
  ✅ GPS verification passed

✅ All validations passed - marking attendance
✅ Attendance marked successfully
```

---

## 🎭 DEMO TIPS

### For Testing Without Being at Office

**Option 1: Browser Location Spoofing**
1. Open Chrome DevTools (F12)
2. Press `Ctrl+Shift+P` (Command Palette)
3. Type "sensors"
4. Select "Show Sensors"
5. Under "Location", select "Other"
6. Enter:
   - Latitude: 18.5976337
   - Longitude: 73.8056611
7. Click "Mark Attendance"

**Option 2: Use Mobile Device**
1. If you're at the actual office location
2. Open app on mobile browser
3. Allow location permission
4. Mark attendance

**Option 3: Adjust Radius for Testing**
```sql
-- Temporarily increase radius for testing
UPDATE offices
SET radius_meters = 5000  -- 5km radius
WHERE latitude = 18.5976337;

-- After demo, reset to 100m
UPDATE offices
SET radius_meters = 100
WHERE latitude = 18.5976337;
```

---

## 📊 VERIFICATION CHECKLIST

### Database ✅
- [ ] Office coordinates set to 18.5976337, 73.8056611
- [ ] Radius set to 100 meters
- [ ] Office is active
- [ ] Employee assigned to this office

### Backend ✅
- [ ] GPS coordinates required (no hardcoded values)
- [ ] Distance calculated using Haversine formula
- [ ] Comparison uses database values only
- [ ] Error returned if outside radius

### Frontend ✅
- [ ] Browser requests location permission
- [ ] GPS coordinates sent to backend
- [ ] Error messages displayed correctly
- [ ] Success flow works

### Demo Behavior ✅
- [ ] Location OFF → attendance blocked
- [ ] Location ON, far away → blocked
- [ ] Location ON, near office → allowed

---

## 🔍 TROUBLESHOOTING

### "Location Required" Error
- Check browser location permission
- Ensure HTTPS (required for geolocation API)
- Try different browser

### "Outside Office Premises" Error
- Verify your actual GPS coordinates
- Check office coordinates in database
- Consider increasing radius temporarily for testing
- Use browser location spoofing (see above)

### "Office location not configured" Error
- Run `SET_OFFICE_GPS_LOCATION.sql`
- Verify office has latitude/longitude set
- Check office is active

### Employee Not Assigned to Office
```sql
-- Check employee's office assignment
SELECT 
  p.email,
  p.office_location,
  o.name as office_name,
  o.latitude,
  o.longitude
FROM profiles p
LEFT JOIN offices o ON o.id = p.office_location
WHERE p.email = 'your-employee@email.com';

-- If office_location is NULL, assign it
UPDATE profiles
SET office_location = (SELECT id FROM offices WHERE is_active = true LIMIT 1)
WHERE email = 'your-employee@email.com';
```

---

## 📝 FILES MODIFIED

### Backend
- ✅ `server/services/attendance.service.ts` - Made Wi-Fi optional for GPS demo

### Database
- ✅ `COMPLETE_DATABASE_SETUP.sql` - Updated with Pune office coordinates
- ✅ `SET_OFFICE_GPS_LOCATION.sql` - NEW script to set office location

### Documentation
- ✅ `GPS_DEMO_SETUP.md` - This file

---

## ✅ CONFIRMATION

### Office GPS Coordinates ✅
- Stored in database: `offices` table
- Latitude: 18.5976337
- Longitude: 73.8056611
- Radius: 100 meters
- No hardcoded values in code

### Backend GPS Comparison ✅
- Fetches office coordinates from database
- Calculates distance using Haversine formula
- Compares employee GPS vs office GPS
- Returns error if distance > radius

### Attendance Blocking ✅
- Location OFF → `GPS_REQUIRED` error
- Location ON, far away → `OUTSIDE_OFFICE_LOCATION` error
- Location ON, near office → Attendance marked ✅

### Demo Ready ✅
- All scenarios work as expected
- Clear error messages
- Comprehensive logging
- Easy to demonstrate

---

**Status**: ✅ READY FOR DEMO  
**Office Location**: Pune (18.5976337, 73.8056611)  
**Radius**: 100 meters  
**Date**: February 10, 2026
