-- ============================================
-- FIX ATTENDANCE RLS POLICIES
-- Run this in Supabase SQL Editor to fix 406 errors
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_own_attendance" ON attendance;
DROP POLICY IF EXISTS "enable_insert_own_attendance" ON attendance;
DROP POLICY IF EXISTS "enable_update_own_attendance" ON attendance;
DROP POLICY IF EXISTS "enable_delete_own_attendance" ON attendance;

-- Re-enable RLS (in case it was disabled)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own attendance
CREATE POLICY "enable_read_own_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own attendance
-- Backend service validates role, status, office, time window, duplicates
CREATE POLICY "enable_insert_own_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own attendance (for check-out)
CREATE POLICY "enable_update_own_attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Verify policies are created
-- ============================================
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
WHERE tablename = 'attendance'
ORDER BY policyname;

-- ============================================
-- Test query (should return empty result, not error)
-- ============================================
-- SELECT * FROM attendance 
-- WHERE user_id = auth.uid() 
-- AND date = CURRENT_DATE;
