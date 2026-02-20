# Auto-Checkout Cron Job Setup

## Overview
The auto-checkout cron job automatically checks out employees who haven't manually checked out by the configured default time.

## Updated Features

### ✅ Dynamic Configuration
- **Reads from Database**: No longer hardcoded to 6:00 PM
- **Respects Settings**: Uses `default_checkout_time` from `attendance_settings` table
- **Toggle Support**: Respects `auto_checkout_enabled` flag
- **Fallback**: Uses 6:30 PM if settings not found

### How It Works

1. **Cron Job Runs** (scheduled time)
2. **Fetches Settings** from database:
   - `default_checkout_time` (e.g., "18:30:00")
   - `auto_checkout_enabled` (true/false)
3. **Checks Toggle**: If disabled, exits without processing
4. **Finds Pending Checkouts**: Employees who checked in but haven't checked out
5. **Sets Checkout Time**: Uses the configured default time
6. **Logs Results**: Shows how many employees were checked out

## Scheduling the Cron Job

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project
   - Navigate to "Edge Functions" in the sidebar

2. **Deploy the Function** (if not already deployed)
   ```bash
   supabase functions deploy auto-checkout-cron
   ```

3. **Set Environment Variables**
   - Go to Project Settings → Edge Functions
   - Add these variables:
     - `SUPABASE_URL`: Your project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
     - `CRON_SECRET`: A random secret string for security

4. **Schedule the Cron**
   - Go to Database → Cron Jobs (pg_cron extension)
   - Or use Supabase CLI to schedule

### Option 2: Using pg_cron (PostgreSQL)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run daily at 7:00 PM IST (1:30 PM UTC)
-- Adjust the time based on when you want it to run
SELECT cron.schedule(
  'auto-checkout-daily',           -- Job name
  '30 13 * * *',                   -- Cron expression (1:30 PM UTC = 7:00 PM IST)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_CRON_SECRET'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Important**: Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_CRON_SECRET` with your cron secret
- Adjust the cron expression time as needed

### Option 3: External Cron Service

Use services like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

Configure them to call:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
```

## Cron Expression Guide

The cron expression format: `minute hour day month weekday`

Examples:
- `30 13 * * *` - Daily at 1:30 PM UTC (7:00 PM IST)
- `0 14 * * *` - Daily at 2:00 PM UTC (7:30 PM IST)
- `30 12 * * *` - Daily at 12:30 PM UTC (6:00 PM IST)
- `0 13 * * 1-5` - Weekdays only at 1:00 PM UTC (6:30 PM IST)

**IST to UTC Conversion**: IST is UTC+5:30
- 6:00 PM IST = 12:30 PM UTC
- 6:30 PM IST = 1:00 PM UTC
- 7:00 PM IST = 1:30 PM UTC

## Recommended Schedule

**Schedule the cron to run AFTER your default checkout time.**

Example:
- If default checkout time is 6:30 PM IST
- Schedule cron at 7:00 PM IST (1:30 PM UTC)
- This gives a 30-minute buffer

## Testing the Cron Job

### Manual Test (Recommended)

1. **Using curl**:
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

2. **Using Postman**:
   - Method: POST
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron`
   - Headers:
     - `Authorization: Bearer YOUR_CRON_SECRET`
     - `Content-Type: application/json`

3. **Check Logs**:
   - Go to Edge Functions → auto-checkout-cron → Logs
   - Look for success messages and processed count

### Test Checklist

- [ ] Cron job runs without errors
- [ ] Reads default checkout time from database
- [ ] Respects auto-checkout enabled/disabled toggle
- [ ] Finds employees who need checkout
- [ ] Sets correct checkout time (in UTC)
- [ ] Displays correct time in IST on frontend
- [ ] Logs show processed count

## Monitoring

### Check Cron Job Status

```sql
-- View scheduled cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Check Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on `auto-checkout-cron`
4. View Logs tab

### Expected Log Output

```
🕐 [AUTO CHECK-OUT CRON] Starting automatic check-out process...
📅 Processing date: 2024-02-20 (IST)
⏰ Current IST time: 2024-02-20T19:00:00.000Z
📋 Fetching checkout settings from database...
⚙️  Auto-checkout enabled: true
⚙️  Default checkout time from settings: 18:30
🕕 Check-out time (IST): 6:30 PM
🕕 Check-out time (UTC): 2024-02-20T13:00:00.000Z
📋 Found 5 attendance records to check out
✅ Successfully checked out 5 employees
  ✓ User abc123: present → checked out at 6:30 PM
  ✓ User def456: late → checked out at 6:30 PM
  ...
```

## Troubleshooting

### Issue: Cron job not running

**Solutions**:
1. Check if pg_cron extension is enabled
2. Verify cron expression is correct
3. Check Edge Function is deployed
4. Verify environment variables are set

### Issue: Wrong checkout time

**Solutions**:
1. Verify `default_checkout_time` in database
2. Check timezone conversion (IST to UTC)
3. Review cron job logs for actual time used

### Issue: Auto-checkout not working

**Solutions**:
1. Check `auto_checkout_enabled` setting in database
2. Verify employees have checked in
3. Check if employees already checked out manually
4. Review function logs for errors

### Issue: Times showing incorrectly

**Solutions**:
1. Verify UTC to IST conversion in frontend
2. Check database stores times in UTC
3. Run `RUN_THIS_IN_SUPABASE.sql` to fix existing records

## Configuration Changes

### Change Default Checkout Time

1. **Via Admin UI** (Recommended):
   - Go to Admin Settings → Checkout Settings
   - Change default checkout time
   - Save

2. **Via SQL**:
```sql
UPDATE attendance_settings
SET setting_value = '19:00:00'  -- 7:00 PM
WHERE setting_name = 'default_checkout_time';
```

### Enable/Disable Auto-Checkout

1. **Via Admin UI** (Recommended):
   - Go to Admin Settings → Checkout Settings
   - Toggle auto-checkout on/off
   - Save

2. **Via SQL**:
```sql
UPDATE attendance_settings
SET setting_value = 'false'  -- or 'true'
WHERE setting_name = 'auto_checkout_enabled';
```

## Security

### Cron Secret

The `CRON_SECRET` environment variable protects the endpoint from unauthorized access.

**Generate a secure secret**:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Set in Supabase**:
1. Go to Project Settings → Edge Functions
2. Add environment variable: `CRON_SECRET`
3. Paste the generated secret

## Summary

✅ **Updated**: Cron job now reads settings from database
✅ **Dynamic**: Uses configured default checkout time
✅ **Toggleable**: Respects auto-checkout enabled/disabled
✅ **Fallback**: Uses 6:30 PM if settings not found
✅ **Secure**: Protected by CRON_SECRET

The cron job is now fully integrated with your admin settings!
