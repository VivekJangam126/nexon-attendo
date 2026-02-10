-- ============================================
-- FIX RLS POLICIES - Remove Circular References
-- Run this in Supabase SQL Editor to fix the 500 errors
-- ============================================

-- Disable RLS temporarily to fix policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "enable_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "enable_admin_update" ON profiles;
DROP POLICY IF EXISTS "enable_insert_profiles" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY "enable_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Allow insert during registration (no auth required)
CREATE POLICY "enable_insert_profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Policy 3: Users can update their own profile
CREATE POLICY "enable_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Note: Admin policies removed to avoid circular reference
-- Admins will use service role key for admin operations
-- ============================================

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
