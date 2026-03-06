-- ============================================
-- QUICK ATTENDANCE CHECK
-- Run this in Supabase SQL Editor to see today and yesterday's data
-- ============================================

-- Show today and yesterday's attendance with IST times
SELECT 
  a.date,
  p.full_name,
  p.email,
  -- UTC times (as stored in database)
  a.check_in_time::TIME as check_in_utc,
  a.check_out_time::TIME as check_out_utc,
  -- IST times (converted for display)
  (a.check_in_time AT TIME ZONE 'Asia/Kolkata')::TIME as check_in_ist,
  (a.check_out_time AT TIME ZONE 'Asia/Kolkata')::TIME as check_out_ist,
  -- Status and work hours
  a.status,
  CASE 
    WHEN a.check_out_time IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 3600, 2)
    ELSE NULL
  END as work_hours
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE a.date IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day')
ORDER BY a.date DESC, p.full_name;
