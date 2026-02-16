# Setup Attendance Settings - Complete Guide

## Problem
The `attendance_settings` table exists but has no records. This causes the grace period functionality to fail.

## Solution
You need to insert the default attendance window record into the database.

---

## Step 1: Insert Default Settings via Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the following SQL:

```sql
-- Insert default attendance window (09:00 AM to 6:00 PM with 30 min grace period)
INSERT INTO attendance_settings (
    setting_name, 
    start_time, 
    end_time, 
    grace_period_minutes, 
    strict_mode, 
    is_active
)
VALUES (
    'default_attendance_window', 
    '09:00:00', 
    '18:00:00', 
    30, 
    true, 
    true
)
ON CONFLICT (setting_name) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    grace_period_minutes = EXCLUDED.grace_period_minutes,
    strict_mode = EXCLUDED.strict_mode,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
```

6. Click "Run" (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

---

## Step 2: Verify the Insert

Run this SQL to verify the record was created:

```sql
SELECT * FROM attendance_settings;
```

You should see one record with:
- setting_name: 'default_attendance_window'
- start_time: '09:00:00'
- end_time: '18:00:00'
- grace_period_minutes: 30
- strict_mode: true
- is_active: true

---

## Step 3: Run Diagnostic Script

In your terminal, run:

```bash
npm run diagnose
```

You should now see:
```
✅ Found 1 records
📊 Records: [{ setting_name: 'default_attendance_window', ... }]
```

---

## Step 4: Run Full Test Suite

```bash
npm run test:grace-period
```

All 5 tests should now pass:
- ✅ Fetch Window Settings
- ✅ Grace Period Calculation
- ✅ Fetch Employee Data
- ✅ Verify Attendance Records
- ✅ Window Time Display

---

## Step 5: Fix Existing Attendance Records (Optional)

If you have attendance records that were marked before the grace period was set correctly, run this SQL to fix them:

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

---

## Understanding the Settings

### Current Configuration
- **Window Start**: 09:00 AM IST
- **Window End**: 06:00 PM IST
- **Grace Period**: 30 minutes
- **Grace Period Ends**: 09:30 AM IST

### How It Works
- **Before 9:00 AM**: Cannot mark attendance (window not open)
- **9:00 AM - 9:30 AM**: Marked as **Present** ✓
- **9:30 AM - 6:00 PM**: Marked as **Late** ⚠️
- **After 6:00 PM**: Cannot mark attendance (window closed)

### Changing Settings
Admins can change these settings from:
- **Attendance Window**: Settings → Attendance Window
- **Grace Period**: Settings → Grace Period (5, 10, 15, 20, or 30 minutes)

---

## Troubleshooting

### Issue: "No active window found"
**Cause**: No record in `attendance_settings` table  
**Solution**: Run Step 1 above

### Issue: "Row-level security policy violation"
**Cause**: Trying to insert via API instead of SQL Editor  
**Solution**: Use Supabase SQL Editor (bypasses RLS)

### Issue: Employees showing wrong status
**Cause**: Old records created before grace period was set  
**Solution**: Run Step 5 to fix existing records

### Issue: Grace period changes not taking effect
**Cause**: Server needs restart to clear cache  
**Solution**: Restart your development server

---

## Summary

1. ✅ Insert default settings via Supabase SQL Editor
2. ✅ Verify with `npm run diagnose`
3. ✅ Test with `npm run test:grace-period`
4. ✅ Fix old records if needed
5. ✅ Restart server if changes don't take effect

After completing these steps, the grace period functionality will work correctly!
