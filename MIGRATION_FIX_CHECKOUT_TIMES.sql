-- ============================================
-- FIX CHECKOUT TIMES MIGRATION
-- Converts existing checkout times from wrong UTC to correct UTC
-- ============================================
--
-- Problem: Checkout times were stored as 18:00:00 UTC (6:00 PM UTC)
-- This displays as 11:30 PM IST (18:00 + 5:30 = 23:30)
--
-- Solution: Convert to 12:30:00 UTC (12:30 PM UTC)
-- This displays as 6:00 PM IST (12:30 + 5:30 = 18:00)
--
-- ============================================

-- Step 1: Check current checkout times
-- Run this first to see what needs to be fixed
SELECT 
  id,
  user_id,
  date,
  check_in_time,
  check_out_time,
  EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') as checkout_hour_utc,
  check_out_time AT TIME ZONE 'Asia/Kolkata' as checkout_ist
FROM attendance
WHERE check_out_time IS NOT NULL
ORDER BY date DESC
LIMIT 10;

-- ============================================
-- Step 2: Fix checkout times
-- This updates all checkout times that are at 18:00 UTC
-- to be at 12:30 UTC instead
-- ============================================

-- IMPORTANT: Backup your data before running this!
-- CREATE TABLE attendance_backup AS SELECT * FROM attendance;

-- Update checkout times from 18:00 UTC to 12:30 UTC
-- This affects records where checkout is at 6:00 PM UTC (wrong)
UPDATE attendance
SET check_out_time = (
  -- Take the date part and add 12:30:00 UTC
  DATE(check_out_time) + INTERVAL '12 hours 30 minutes'
)
WHERE 
  check_out_time IS NOT NULL
  AND EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 18
  AND EXTRACT(MINUTE FROM check_out_time AT TIME ZONE 'UTC') = 0;

-- ============================================
-- Step 3: Verify the fix
-- Check that times are now correct
-- ============================================

SELECT 
  id,
  user_id,
  date,
  check_out_time,
  EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') as checkout_hour_utc,
  check_out_time AT TIME ZONE 'Asia/Kolkata' as checkout_ist,
  TO_CHAR(check_out_time AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM') as checkout_ist_formatted
FROM attendance
WHERE check_out_time IS NOT NULL
ORDER BY date DESC
LIMIT 10;

-- Expected result: checkout_ist_formatted should show "06:00 PM"

-- ============================================
-- Alternative: More precise update
-- If you want to be more specific about which records to update
-- ============================================

-- Update only records from the last 30 days
UPDATE attendance
SET check_out_time = (
  DATE(check_out_time) + INTERVAL '12 hours 30 minutes'
)
WHERE 
  check_out_time IS NOT NULL
  AND EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 18
  AND EXTRACT(MINUTE FROM check_out_time AT TIME ZONE 'UTC') = 0
  AND date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- Rollback (if needed)
-- ============================================

-- If something goes wrong, restore from backup:
-- DELETE FROM attendance;
-- INSERT INTO attendance SELECT * FROM attendance_backup;
-- DROP TABLE attendance_backup;

-- ============================================
-- NOTES
-- ============================================

-- 1. This migration only affects checkout times
-- 2. Check-in times are not affected (they are correct)
-- 3. Only updates records where checkout is at 18:00 UTC (6:00 PM UTC)
-- 4. After this migration, all checkout times will display as 6:00 PM IST
-- 5. Future records will be stored correctly by the updated cron job

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count records that need fixing
SELECT COUNT(*) as records_to_fix
FROM attendance
WHERE 
  check_out_time IS NOT NULL
  AND EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 18
  AND EXTRACT(MINUTE FROM check_out_time AT TIME ZONE 'UTC') = 0;

-- Count records already fixed
SELECT COUNT(*) as records_fixed
FROM attendance
WHERE 
  check_out_time IS NOT NULL
  AND EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 12
  AND EXTRACT(MINUTE FROM check_out_time AT TIME ZONE 'UTC') = 30;

-- Show all checkout times grouped by hour
SELECT 
  EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') as utc_hour,
  COUNT(*) as count,
  TO_CHAR(MIN(check_out_time AT TIME ZONE 'Asia/Kolkata'), 'HH12:MI AM') as sample_ist_time
FROM attendance
WHERE check_out_time IS NOT NULL
GROUP BY EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC')
ORDER BY utc_hour;

