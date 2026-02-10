-- ============================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE
-- ============================================

-- Fix profiles table policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "enable_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "enable_admin_update" ON profiles;
DROP POLICY IF EXISTS "enable_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "enable_update_own_profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enable_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "enable_insert_profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "enable_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Done! Your 500 errors should be fixed now.
