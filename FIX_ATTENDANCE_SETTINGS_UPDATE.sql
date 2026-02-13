-- ============================================
-- Fix Attendance Settings Update Permission
-- ============================================
-- This script adds the missing UPDATE policy for attendance_settings
-- so that admins can update the attendance window

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Admins can update settings" ON attendance_settings;

-- Create policy: Admins can update attendance settings
CREATE POLICY "Admins can update settings"
  ON attendance_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'attendance_settings';

-- Test query (should work for admins)
-- UPDATE attendance_settings 
-- SET start_time = '10:00:00', end_time = '19:00:00'
-- WHERE setting_name = 'default_attendance_window';

-- Verify the update
SELECT 
  setting_name,
  start_time,
  end_time,
  is_active,
  updated_by,
  updated_at
FROM attendance_settings
WHERE setting_name = 'default_attendance_window';
