-- ============================================
-- MIGRATION: Remove Grace Period Maximum Limit
-- ============================================
-- This migration removes the grace_period_minutes constraint
-- to allow unlimited grace period duration
--
-- Run this in Supabase SQL Editor if you already have the grace_period_minutes column
-- ============================================

-- Drop the old constraint
ALTER TABLE attendance_settings 
DROP CONSTRAINT IF EXISTS attendance_settings_grace_period_minutes_check;

-- Add new constraint with no maximum limit (only minimum of 0)
ALTER TABLE attendance_settings 
ADD CONSTRAINT attendance_settings_grace_period_minutes_check 
CHECK (grace_period_minutes >= 0);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance_settings' 
AND column_name = 'grace_period_minutes';

-- Show current grace period setting
SELECT 
  setting_name,
  grace_period_minutes,
  updated_at
FROM attendance_settings 
WHERE setting_name = 'default_attendance_window';

