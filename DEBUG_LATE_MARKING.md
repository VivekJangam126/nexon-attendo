# Debug: Late Marking Not Working

## Steps to Diagnose:

### 1. Check if Migration Was Run
Run this in Supabase SQL Editor:
```sql
-- Check if grace_period_minutes column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'attendance_settings';

-- Check current values
SELECT * FROM attendance_settings;
```

**Expected Result:**
- Should see `grace_period_minutes` column with INTEGER type
- Should see `strict_mode` column with BOOLEAN type
- Default value should be 15 for grace_period_minutes

---

### 2. If Column Doesn't Exist, Run Migration
```sql
-- Run the migration
ALTER TABLE attendance_settings 
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15 
CHECK (grace_period_minutes >= 0 AND grace_period_minutes <= 60);

ALTER TABLE attendance_settings 
ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT true;

-- Update existing record
UPDATE attendance_settings 
SET grace_period_minutes = 15, strict_mode = true
WHERE setting_name = 'default_attendance_window';
```

---

### 3. Test Late Marking Logic

**Scenario 1: Check-in within grace period (should be PRESENT)**
- Window starts: 10:00 AM
- Grace period: 15 minutes
- Check-in at: 10:10 AM
- Expected: **PRESENT** ✓

**Scenario 2: Check-in after grace period (should be LATE)**
- Window starts: 10:00 AM
- Grace period: 15 minutes  
- Check-in at: 10:20 AM
- Expected: **LATE** ⏰

---

### 4. Check Server Logs

When marking attendance, check the server console for these logs:
```
⏰ Check-in time analysis:
  Window starts: 10:00
  Grace period ends: 10:15
  Check-in time: 10:20
  Status: LATE
```

---

### 5. Verify Attendance Window Settings

Run this query to see current settings:
```sql
SELECT 
  setting_name,
  start_time,
  end_time,
  grace_period_minutes,
  strict_mode,
  is_active
FROM attendance_settings
WHERE setting_name = 'default_attendance_window';
```

**Expected:**
- start_time: 09:30:00 (or your configured time)
- grace_period_minutes: 15
- strict_mode: true or false
- is_active: true

---

### 6. Test with Different Grace Periods

To test quickly, temporarily set grace period to 5 minutes:
```sql
UPDATE attendance_settings 
SET grace_period_minutes = 5
WHERE setting_name = 'default_attendance_window';
```

Then:
- Check-in within 5 minutes of start → PRESENT
- Check-in after 5 minutes → LATE

---

### 7. Check Attendance Records

After marking attendance, verify the status:
```sql
SELECT 
  a.date,
  a.check_in_time,
  a.status,
  p.full_name,
  p.email
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE a.date = CURRENT_DATE
ORDER BY a.check_in_time DESC;
```

---

## Common Issues:

### Issue 1: Migration Not Run
**Symptom:** grace_period_minutes column doesn't exist
**Fix:** Run MIGRATION_ADD_GRACE_PERIOD.sql

### Issue 2: Grace Period is NULL
**Symptom:** All check-ins marked as PRESENT
**Fix:** 
```sql
UPDATE attendance_settings 
SET grace_period_minutes = 15
WHERE grace_period_minutes IS NULL;
```

### Issue 3: Window Not Configured
**Symptom:** Error "No active attendance window configured"
**Fix:**
```sql
INSERT INTO attendance_settings (setting_name, start_time, end_time, grace_period_minutes, strict_mode, is_active)
VALUES ('default_attendance_window', '09:30:00', '18:00:00', 15, true, true)
ON CONFLICT (setting_name) DO UPDATE
SET grace_period_minutes = 15, strict_mode = true, is_active = true;
```

### Issue 4: Strict Mode Disabled
**Symptom:** Attendance marked without GPS/WiFi but still showing PRESENT
**Fix:** Check if window variable is accessible in non-strict mode section

---

## Quick Test Commands:

```sql
-- Set grace period to 5 minutes for testing
UPDATE attendance_settings SET grace_period_minutes = 5;

-- Set grace period back to 15 minutes
UPDATE attendance_settings SET grace_period_minutes = 15;

-- Check today's attendance with statuses
SELECT 
  p.full_name,
  a.check_in_time::time as check_in,
  a.status,
  EXTRACT(HOUR FROM a.check_in_time) * 60 + EXTRACT(MINUTE FROM a.check_in_time) as check_in_minutes
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE a.date = CURRENT_DATE
ORDER BY a.check_in_time;
```
