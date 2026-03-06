-- Reset Auto-Checkouts to NULL
-- This script resets checkouts that were done automatically by the cron
-- while preserving manual checkouts done by employees

-- Strategy: Auto-checkouts have check_out_time matching exactly the configured time
-- Manual checkouts will have different times

-- Step 1: Get the configured checkout time
SELECT default_checkout_time FROM attendance_settings WHERE setting_name = 'default_attendance_window';

-- Step 2: Reset checkouts that match the configured time exactly (auto-checkouts)
-- Replace '14:35:00' with your configured checkout time from Step 1
UPDATE attendance
SET check_out_time = NULL,
    updated_at = NOW()
WHERE date = CURRENT_DATE
  AND check_out_time IS NOT NULL
  AND (check_out_time AT TIME ZONE 'Asia/Kolkata')::TIME = '14:35:00'::TIME;

-- Step 3: Verify the reset
SELECT 
  COUNT(*) FILTER (WHERE check_out_time IS NULL) as no_checkout,
  COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) as has_checkout,
  COUNT(*) as total
FROM attendance
WHERE date = CURRENT_DATE;
