# Auto-Checkout Final Setup Guide

## Overview

The auto-checkout system now runs **once daily at 8:00 PM IST** and checks out all employees who haven't checked out manually.

## How It Works

1. **Cron Schedule**: Runs daily at 8:00 PM IST (14:30 UTC)
2. **Checkout Time**: Sets checkout to admin-configured time (e.g., 6:30 PM), NOT 8 PM
3. **Manual Checkouts**: Preserved - only employees without checkout are affected
4. **Auto-Checkouts**: Can be reset to NULL while keeping manual checkouts

---

## Step 1: Update Cron Schedule to Daily at 8 PM

Run this SQL in Supabase SQL Editor:

```sql
-- Unschedule the every-5-minutes job
SELECT cron.unschedule('auto-checkout-every-5-min');

-- Schedule daily at 8 PM IST (14:30 UTC)
SELECT cron.schedule(
  'auto-checkout-daily-8pm',
  '30 14 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://falbkccaqjqdbvrmdlll.supabase.co/functions/v1/auto-checkout-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify
SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'auto-checkout-daily-8pm';
```

---

## Step 2: Reset Auto-Checkouts to NULL (Optional)

If you want to reset today's auto-checkouts while keeping manual checkouts:

```sql
-- First, check the configured checkout time
SELECT default_checkout_time FROM attendance_settings 
WHERE setting_name = 'default_attendance_window';

-- Reset checkouts that match the configured time exactly (auto-checkouts)
-- Replace '14:35:00' with the time from above query
UPDATE attendance
SET check_out_time = NULL,
    updated_at = NOW()
WHERE date = CURRENT_DATE
  AND check_out_time IS NOT NULL
  AND (check_out_time AT TIME ZONE 'Asia/Kolkata')::TIME = '14:35:00'::TIME;

-- Verify
SELECT 
  COUNT(*) FILTER (WHERE check_out_time IS NULL) as no_checkout,
  COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) as manual_checkout,
  COUNT(*) as total
FROM attendance
WHERE date = CURRENT_DATE;
```

---

## How to Distinguish Auto vs Manual Checkouts

**Auto-checkouts** have `check_out_time` that matches exactly the configured time:
- If configured time is 6:30 PM, auto-checkouts will be at exactly 18:30:00

**Manual checkouts** have different times:
- Employees check out at various times like 18:25:43, 18:32:15, etc.

---

## Configuration

### Current Setup:
- **Cron runs**: Daily at 8:00 PM IST
- **Checkout time**: Set by admin in Settings (e.g., 6:30 PM)
- **Function**: Deployed and working

### To Change Checkout Time:
1. Admin goes to Settings → Checkout Settings
2. Updates the checkout time
3. Changes take effect immediately (no redeployment needed)

### To Change Cron Time:
If you want to run at a different time (not 8 PM):

```sql
-- Example: Run at 11:59 PM IST (18:29 UTC)
SELECT cron.unschedule('auto-checkout-daily-8pm');

SELECT cron.schedule(
  'auto-checkout-daily-11:59pm',
  '29 18 * * *',  -- 11:59 PM IST
  $$ [same http_post command as above] $$
);
```

---

## Testing

### Test Manually:
```bash
# PowerShell
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "https://falbkccaqjqdbvrmdlll.supabase.co/functions/v1/auto-checkout-cron" -Method POST -Headers $headers -Body "{}"
```

### Check Cron History:
```sql
SELECT 
  status,
  return_message,
  start_time AT TIME ZONE 'Asia/Kolkata' as start_ist,
  end_time AT TIME ZONE 'Asia/Kolkata' as end_ist
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-checkout-daily-8pm')
ORDER BY start_time DESC
LIMIT 10;
```

---

## Benefits of Daily at 8 PM

✅ **Performance**: Only 1 call per day (vs 288 calls with every-5-min)
✅ **Predictable**: Always runs at same time
✅ **Flexible**: Checkout time still configurable by admin
✅ **Clean**: Easy to identify auto-checkouts (exact time match)

---

## Summary

1. ✅ Cron runs once daily at 8:00 PM IST
2. ✅ Sets checkout to admin-configured time (not 8 PM)
3. ✅ Only affects employees without checkout
4. ✅ Manual checkouts preserved
5. ✅ Auto-checkouts can be reset by matching exact time
6. ✅ Function deployed and working

**Next auto-checkout**: Today at 8:00 PM IST
