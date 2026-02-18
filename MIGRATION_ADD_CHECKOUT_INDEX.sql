-- ============================================
-- AUTO CHECK-OUT SYSTEM
-- Migration: Add index for check_out_time
-- ============================================

-- Add index on check_out_time for performance
-- This helps with queries that filter by NULL check_out_time
CREATE INDEX IF NOT EXISTS idx_attendance_check_out_time 
ON attendance(check_out_time);

-- Add composite index for date + check_out_time
-- Optimizes the cron job query
CREATE INDEX IF NOT EXISTS idx_attendance_date_checkout 
ON attendance(date, check_out_time);

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'attendance'
  AND indexname LIKE '%checkout%'
ORDER BY indexname;
