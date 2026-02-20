-- ============================================
-- FIX ALL CHECKOUT TIME ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check what needs to be fixed
-- This shows you the current state
SELECT 
  date,
  check_in_time,
  check_out_time,
  CASE 
    WHEN check_out_time IS NULL THEN 'No checkout'
    WHEN EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 18 THEN 'Wrong time (11:30 PM)'
    WHEN EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 12 THEN 'Correct (6:00 PM)'
    ELSE 'Other time'
  END as status,
  (check_out_time AT TIME ZONE 'Asia/Kolkata')::TIME as checkout_ist
FROM attendance
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC
LIMIT 20;

-- ============================================
-- STEP 2: FIX WRONG CHECKOUT TIMES (18:00 UTC → 12:30 UTC)
-- This fixes records showing 11:30 PM to show 6:00 PM
-- ============================================

UPDATE attendance
SET 
  check_out_time = (DATE(check_out_time) + TIME '12:30:00'),
  updated_at = NOW()
WHERE 
  check_out_time IS NOT NULL
  AND EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 18
  AND EXTRACT(MINUTE FROM check_out_time AT TIME ZONE 'UTC') = 0;

-- ============================================
-- STEP 3: FIX MISSING CHECKOUT TIMES FOR PAST DATES
-- This adds 6:00 PM checkout for past records without checkout
-- ============================================

UPDATE attendance
SET 
  check_out_time = (date || ' 12:30:00+00')::timestamptz,
  updated_at = NOW()
WHERE 
  -- Only past dates (not today)
  date < (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
  -- Only records without checkout
  AND check_out_time IS NULL
  -- Only records that have check-in
  AND check_in_time IS NOT NULL;

-- ============================================
-- STEP 4: VERIFY THE FIX
-- All checkout times should now show 6:00 PM IST
-- ============================================

SELECT 
  date,
  check_in_time::TIME as check_in,
  check_out_time::TIME as check_out_utc,
  (check_out_time AT TIME ZONE 'Asia/Kolkata')::TIME as check_out_ist,
  status
FROM attendance
WHERE check_out_time IS NOT NULL
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC
LIMIT 10;

-- Expected: check_out_ist should show 18:00:00 (6:00 PM)

-- ============================================
-- STEP 5: COUNT SUMMARY
-- ============================================

SELECT 
  'Total records' as description,
  COUNT(*) as count
FROM attendance
WHERE date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
  'With checkout at 6:00 PM' as description,
  COUNT(*) as count
FROM attendance
WHERE check_out_time IS NOT NULL
  AND EXTRACT(HOUR FROM check_out_time AT TIME ZONE 'UTC') = 12
  AND EXTRACT(MINUTE FROM check_out_time AT TIME ZONE 'UTC') = 30
  AND date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
  'Still without checkout' as description,
  COUNT(*) as count
FROM attendance
WHERE check_out_time IS NULL
  AND date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- NOTES
-- ============================================

-- 1. This fixes all records from the last 30 days
-- 2. Today's record is NOT affected (will be auto-checked-out at 6 PM)
-- 3. After running this, refresh your app to see the changes
-- 4. All checkout times will display as 6:00 PM IST

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- If you want to be safe, create a backup first:
-- CREATE TABLE attendance_backup AS SELECT * FROM attendance;

-- To restore:
-- DELETE FROM attendance;
-- INSERT INTO attendance SELECT * FROM attendance_backup;
-- DROP TABLE attendance_backup;
