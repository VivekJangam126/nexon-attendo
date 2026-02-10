-- ============================================
-- FIX ATTENDANCE WINDOW AVAILABILITY
-- Run this in Supabase SQL Editor
-- ============================================
-- 
-- This script fixes the attendance availability issue by:
-- 1. Creating attendance_settings table if missing
-- 2. Fixing incorrect default time window
-- 3. Ensuring only one active window exists
-- 4. Setting proper RLS policies
--
-- ============================================

-- ============================================
-- STEP 1: Create attendance_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Enable RLS and create policies
-- ============================================

ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active settings" ON attendance_settings;
DROP POLICY IF EXISTS "enable_read_settings" ON attendance_settings;

-- Policy: Anyone authenticated can read active settings
CREATE POLICY "enable_read_settings"
  ON attendance_settings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- STEP 3: Fix/Insert default attendance window
-- ============================================

-- Delete any existing default window
DELETE FROM attendance_settings 
WHERE setting_name = 'default_attendance_window';

-- Insert correct default window (09:30 AM to 6:00 PM)
INSERT INTO attendance_settings (setting_name, start_time, end_time, is_active)
VALUES ('default_attendance_window', '09:30:00', '18:00:00', true);

-- ============================================
-- STEP 4: Ensure only one active window
-- ============================================

-- Deactivate all windows except the default
UPDATE attendance_settings
SET is_active = false
WHERE setting_name != 'default_attendance_window';

-- Ensure default window is active
UPDATE attendance_settings
SET is_active = true
WHERE setting_name = 'default_attendance_window';

-- ============================================
-- STEP 5: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attendance_settings_active ON attendance_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_settings_name ON attendance_settings(setting_name);

-- ============================================
-- STEP 6: Create trigger for updated_at
-- ============================================

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendance_settings
DROP TRIGGER IF EXISTS update_attendance_settings_updated_at ON attendance_settings;
CREATE TRIGGER update_attendance_settings_updated_at
  BEFORE UPDATE ON attendance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check the attendance window
SELECT 
  setting_name,
  start_time,
  end_time,
  is_active,
  created_at,
  updated_at
FROM attendance_settings
WHERE setting_name = 'default_attendance_window';

-- Expected result:
-- setting_name: default_attendance_window
-- start_time: 09:30:00
-- end_time: 18:00:00
-- is_active: true

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Attendance window fixed successfully!';
  RAISE NOTICE '📅 Default window: 09:30 AM - 6:00 PM';
  RAISE NOTICE '🔄 Please refresh your application';
END $$;
