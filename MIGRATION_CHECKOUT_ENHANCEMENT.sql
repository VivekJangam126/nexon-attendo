-- ============================================
-- MIGRATION: Checkout Enhancement
-- ============================================
-- Adds configurable checkout settings and work hours tracking
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add checkout configuration to attendance_settings
ALTER TABLE attendance_settings 
ADD COLUMN IF NOT EXISTS default_checkout_time TIME DEFAULT '18:30:00',
ADD COLUMN IF NOT EXISTS auto_checkout_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_work_hours DECIMAL(4,2) DEFAULT 8.0;

-- Step 2: Update existing record with default values
UPDATE attendance_settings 
SET 
  default_checkout_time = '18:30:00',
  auto_checkout_enabled = true,
  min_work_hours = 8.0
WHERE setting_name = 'default_attendance_window';

-- Step 3: Add work hours calculation column
-- This automatically calculates work hours when check_out_time is set
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS work_hours DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN check_out_time IS NOT NULL AND check_in_time IS NOT NULL 
    THEN ROUND(CAST(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600 AS NUMERIC), 2)
    ELSE NULL
  END
) STORED;

-- Step 4: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_work_hours 
ON attendance(work_hours) WHERE work_hours IS NOT NULL;

-- Step 5: Create view for daily work summary
CREATE OR REPLACE VIEW daily_work_summary AS
SELECT 
  a.user_id,
  p.full_name,
  a.date,
  a.check_in_time,
  a.check_out_time,
  a.work_hours,
  a.status,
  CASE 
    WHEN a.work_hours IS NULL THEN 'Not Checked Out'
    WHEN a.work_hours < s.min_work_hours THEN 'Under Hours'
    WHEN a.work_hours >= s.min_work_hours THEN 'Complete'
    ELSE 'Unknown'
  END as work_status
FROM attendance a
JOIN profiles p ON a.user_id = p.id
CROSS JOIN attendance_settings s
WHERE s.setting_name = 'default_attendance_window'
ORDER BY a.date DESC, a.check_in_time DESC;

-- Step 6: Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance_settings' 
AND column_name IN ('default_checkout_time', 'auto_checkout_enabled', 'min_work_hours');

-- Step 7: Show current settings
SELECT 
  setting_name,
  start_time,
  end_time,
  grace_period_minutes,
  default_checkout_time,
  auto_checkout_enabled,
  min_work_hours
FROM attendance_settings 
WHERE setting_name = 'default_attendance_window';

-- Step 8: Test work hours calculation
SELECT 
  user_id,
  date,
  check_in_time::time as check_in,
  check_out_time::time as check_out,
  work_hours,
  CASE 
    WHEN work_hours IS NULL THEN 'Not Checked Out'
    WHEN work_hours < 8 THEN 'Under Hours'
    WHEN work_hours >= 8 THEN 'Complete'
  END as status
FROM attendance
WHERE check_in_time IS NOT NULL
ORDER BY date DESC
LIMIT 10;

-- ============================================
-- NOTES:
-- ============================================
-- 1. default_checkout_time: Time when auto-checkout runs (default 6:30 PM)
-- 2. auto_checkout_enabled: Enable/disable auto-checkout feature
-- 3. min_work_hours: Minimum work hours expected (default 8 hours)
-- 4. work_hours: Automatically calculated when checkout is done
-- 5. Auto-checkout cron job will use these settings
-- ============================================
