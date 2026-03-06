# Auto-Checkout Cron Job - Deployment Guide

Complete guide to deploy, test, and schedule the auto-checkout cron job.

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Supabase CLI installed
- ✅ Supabase project created
- ✅ Database migrations applied
- ✅ Checkout settings configured in database

---

## 🚀 Step 1: Install Supabase CLI

### Windows (PowerShell):
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or download from GitHub
# https://github.com/supabase/cli/releases
```

### macOS:
```bash
brew install supabase/tap/supabase
```

### Linux:
```bash
# Using npm
npm install -g supabase

# Or using binary
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
```

### Verify Installation:
```bash
supabase --version
```

---

## 🔐 Step 2: Login to Supabase

```bash
# Login to Supabase
supabase login

# This will open a browser window
# Login with your Supabase credentials
```

---

## 🔗 Step 3: Link Your Project

```bash
# Navigate to your project directory
cd nexon-time-keeper

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Find your project ref in Supabase Dashboard:
# Settings → General → Reference ID
```

---

## 📦 Step 4: Deploy the Function

```bash
# Deploy the auto-checkout-cron function
supabase functions deploy auto-checkout-cron

# You should see:
# Deploying function auto-checkout-cron...
# Function deployed successfully!
```

---

## 🔑 Step 5: Set Environment Variables

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **auto-checkout-cron**
3. Click **Settings** tab
4. Add these environment variables:

```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=generate_a_random_secret
```

**To generate CRON_SECRET:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option B: Via CLI

```bash
# Set environment variables
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set CRON_SECRET=your_generated_secret
```

**Find your keys:**
- Go to Supabase Dashboard
- Settings → API
- Copy `URL` and `service_role` key

---

## 🧪 Step 6: Test the Function Manually

### Test 1: Using curl

```bash
# Replace with your values
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Test 2: Using Postman

1. Create new POST request
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron`
3. Headers:
   - `Authorization: Bearer YOUR_CRON_SECRET`
   - `Content-Type: application/json`
4. Click **Send**

### Test 3: Using Supabase Dashboard

1. Go to **Edge Functions** → **auto-checkout-cron**
2. Click **Invoke** button
3. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
4. Click **Invoke**

### Expected Response:

```json
{
  "success": true,
  "message": "Successfully checked out X employees",
  "date": "2024-02-24",
  "processed": 5,
  "checkOutTime": "2024-02-24T12:30:00.000Z"
}
```

Or if auto-checkout is disabled:

```json
{
  "success": true,
  "message": "Auto-checkout is disabled",
  "date": "2024-02-24",
  "processed": 0
}
```

---

## 📊 Step 7: Check Function Logs

### Via Supabase Dashboard:

1. Go to **Edge Functions** → **auto-checkout-cron**
2. Click **Logs** tab
3. You should see:

```
🕐 [AUTO CHECK-OUT CRON] Starting automatic check-out process...
📅 Processing date: 2024-02-24 (IST)
⏰ Current IST time: 2024-02-24T19:00:00.000Z
📋 Fetching checkout settings from database...
⚙️  Auto-checkout enabled: true
⚙️  Default checkout time from settings: 18:30
🕕 Check-out time (IST): 6:30 PM
🕕 Check-out time (UTC): 2024-02-24T13:00:00.000Z
📋 Found 5 attendance records to check out
✅ Successfully checked out 5 employees
```

### Via CLI:

```bash
# View recent logs
supabase functions logs auto-checkout-cron

# Follow logs in real-time
supabase functions logs auto-checkout-cron --follow
```

---

## ⏰ Step 8: Schedule the Cron Job

### Option A: Using pg_cron (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run daily at 7:00 PM IST (1:30 PM UTC)
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
- `YOUR_PROJECT_REF` with your actual project reference
- `YOUR_CRON_SECRET` with your generated secret
- Adjust the cron expression time as needed

### Cron Expression Guide:

```
Format: minute hour day month weekday

Examples:
'30 13 * * *'    - Daily at 1:30 PM UTC (7:00 PM IST)
'0 14 * * *'     - Daily at 2:00 PM UTC (7:30 PM IST)
'30 12 * * *'    - Daily at 12:30 PM UTC (6:00 PM IST)
'0 13 * * 1-5'   - Weekdays only at 1:00 PM UTC (6:30 PM IST)
```

**IST to UTC Conversion:**
- IST is UTC+5:30
- 6:00 PM IST = 12:30 PM UTC
- 6:30 PM IST = 1:00 PM UTC
- 7:00 PM IST = 1:30 PM UTC

### Verify Cron Job:

```sql
-- View scheduled cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Option B: Using External Service

If pg_cron doesn't work, use services like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (if using GitHub)

Configure them to call:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
```

---

## ✅ Step 9: Verify Everything Works

### Checklist:

1. **Function Deployed** ✅
   ```bash
   supabase functions list
   # Should show: auto-checkout-cron
   ```

2. **Environment Variables Set** ✅
   - Check in Supabase Dashboard → Edge Functions → Settings

3. **Manual Test Successful** ✅
   - Run curl command
   - Check response is successful
   - Check logs show no errors

4. **Database Settings Correct** ✅
   ```sql
   SELECT * FROM attendance_settings;
   -- Verify default_checkout_time and auto_checkout_enabled
   ```

5. **Cron Job Scheduled** ✅
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'auto-checkout-daily';
   ```

6. **Test with Real Data** ✅
   - Have an employee check in
   - Wait for cron to run (or trigger manually)
   - Verify checkout time is set correctly

---

## 🐛 Troubleshooting

### Issue 1: Function not deploying

**Error**: `Failed to deploy function`

**Solution**:
```bash
# Check if you're logged in
supabase status

# Re-login if needed
supabase login

# Check if project is linked
supabase projects list

# Re-link if needed
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue 2: Environment variables not working

**Error**: `SUPABASE_URL is undefined`

**Solution**:
- Set via Dashboard (more reliable)
- Or use CLI: `supabase secrets set KEY=VALUE`
- Redeploy after setting: `supabase functions deploy auto-checkout-cron`

### Issue 3: Unauthorized error

**Error**: `401 Unauthorized`

**Solution**:
- Check CRON_SECRET matches in both places
- Verify Authorization header format: `Bearer YOUR_SECRET`
- Check service role key is correct

### Issue 4: Cron not running

**Error**: Cron job doesn't execute

**Solution**:
```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check cron job status
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-checkout-daily')
ORDER BY start_time DESC
LIMIT 5;

-- If no runs, check cron expression is correct
-- If runs but fails, check the error message
```

### Issue 5: Wrong checkout time

**Error**: Checkout time is not 6:00 PM IST

**Solution**:
```sql
-- Check settings
SELECT default_checkout_time FROM attendance_settings;

-- Update if needed
UPDATE attendance_settings
SET default_checkout_time = '18:30:00'
WHERE setting_name = 'default_attendance_window';
```

---

## 📝 Monitoring

### Daily Checks:

1. **Check Logs**:
   - Go to Edge Functions → Logs
   - Look for successful executions
   - Check for errors

2. **Verify Checkouts**:
   ```sql
   SELECT 
     COUNT(*) as checked_out_today,
     (check_out_time AT TIME ZONE 'Asia/Kolkata')::TIME as checkout_ist
   FROM attendance
   WHERE date = CURRENT_DATE
     AND check_out_time IS NOT NULL
   GROUP BY checkout_ist;
   ```

3. **Check Cron History**:
   ```sql
   SELECT 
     start_time,
     end_time,
     status,
     return_message
   FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-checkout-daily')
   ORDER BY start_time DESC
   LIMIT 7;
   ```

---

## 🔄 Updating the Function

If you make changes to the function:

```bash
# 1. Make your changes to supabase/functions/auto-checkout-cron/index.ts

# 2. Redeploy
supabase functions deploy auto-checkout-cron

# 3. Test manually
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-checkout-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 4. Check logs
supabase functions logs auto-checkout-cron
```

---

## 📞 Support

If you encounter issues:

1. Check function logs
2. Verify environment variables
3. Test manually first
4. Check database settings
5. Review cron job history

---

## ✅ Success Criteria

Your auto-checkout is working correctly when:

- ✅ Function deploys without errors
- ✅ Manual test returns success
- ✅ Logs show correct execution
- ✅ Cron job runs daily
- ✅ Employees are checked out at configured time
- ✅ Checkout times display correctly in IST

---

**Last Updated**: February 24, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
