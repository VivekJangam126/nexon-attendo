-- ============================================
-- NEXON ATTENDANCE SYSTEM
-- Complete Database Setup Script
-- Phases 1 & 2: Foundation + Registration & Approval
-- ============================================
-- 
-- Instructions:
-- 1. Open Supabase SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify tables are created
--
-- ============================================

-- ============================================
-- PHASE 1: PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
  office_location UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "enable_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "enable_admin_update" ON profiles;
DROP POLICY IF EXISTS "enable_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "enable_update_own_profile" ON profiles;

-- Policy: Users can read their own profile
-- No circular reference - simple auth.uid() check
CREATE POLICY "enable_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Allow insert during registration
-- Needed for registration flow
CREATE POLICY "enable_insert_profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own profile
CREATE POLICY "enable_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: Admin operations use service role key, not RLS policies
-- This avoids circular reference issues

-- ============================================
-- PHASE 2: OFFICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  wifi_ssids TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on offices
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active offices" ON offices;
DROP POLICY IF EXISTS "Admins can read all offices" ON offices;
DROP POLICY IF EXISTS "Admins can manage offices" ON offices;
DROP POLICY IF EXISTS "enable_read_active_offices" ON offices;
DROP POLICY IF EXISTS "enable_admin_read_all_offices" ON offices;
DROP POLICY IF EXISTS "enable_admin_manage_offices" ON offices;
DROP POLICY IF EXISTS "enable_admin_read_all" ON offices;
DROP POLICY IF EXISTS "enable_admin_write" ON offices;

-- Policy: Anyone (including unauthenticated) can read active offices
-- This is needed for registration page
CREATE POLICY "enable_read_active_offices"
  ON offices FOR SELECT
  USING (is_active = true);

-- Note: Admin office management uses service role key

-- ============================================
-- PHASE 2: EMPLOYEE_REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  office_id UUID NOT NULL REFERENCES offices(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on employee_requests
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own request" ON employee_requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON employee_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON employee_requests;
DROP POLICY IF EXISTS "System can insert requests" ON employee_requests;
DROP POLICY IF EXISTS "enable_read_own_request" ON employee_requests;
DROP POLICY IF EXISTS "enable_insert_requests" ON employee_requests;

-- Policy: Users can read their own request
CREATE POLICY "enable_read_own_request"
  ON employee_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow insert during registration
CREATE POLICY "enable_insert_requests"
  ON employee_requests FOR INSERT
  WITH CHECK (true);

-- Note: Admin operations (approve/reject) use service role key

-- ============================================
-- PHASE 3: ATTENDANCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  office_id UUID NOT NULL REFERENCES offices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS on attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can read all attendance" ON attendance;
DROP POLICY IF EXISTS "Employees can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "enable_read_own_attendance" ON attendance;
DROP POLICY IF EXISTS "enable_insert_own_attendance" ON attendance;

-- Policy: Users can read their own attendance
CREATE POLICY "enable_read_own_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own attendance
-- Backend service validates role, status, office, time window, duplicates
CREATE POLICY "enable_insert_own_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Note: Admin operations use service role key

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_office_location ON profiles(office_location);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_offices_is_active ON offices(is_active);
CREATE INDEX IF NOT EXISTS idx_offices_city ON offices(city);

CREATE INDEX IF NOT EXISTS idx_employee_requests_user_id ON employee_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_office_id ON employee_requests(office_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_reviewed_by ON employee_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_office_id ON attendance(office_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for offices
DROP TRIGGER IF EXISTS update_offices_updated_at ON offices;
CREATE TRIGGER update_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for employee_requests
DROP TRIGGER IF EXISTS update_employee_requests_updated_at ON employee_requests;
CREATE TRIGGER update_employee_requests_updated_at
  BEFORE UPDATE ON employee_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for attendance
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample offices
INSERT INTO offices (name, address, city, state, country, latitude, longitude, wifi_ssids, is_active)
VALUES
  (
    'Nexon HQ - Bangalore',
    '123 Tech Park, Sector 5, Electronic City',
    'Bangalore',
    'Karnataka',
    'India',
    12.9716,
    77.5946,
    ARRAY['Nexon-HQ-5G', 'Nexon-HQ-Guest'],
    true
  ),
  (
    'Nexon Mumbai Office',
    '456 Business Center, Andheri East',
    'Mumbai',
    'Maharashtra',
    'India',
    19.0760,
    72.8777,
    ARRAY['Nexon-Mumbai-5G', 'Nexon-Mumbai-Guest'],
    true
  ),
  (
    'Nexon Delhi Office',
    '789 Corporate Plaza, Connaught Place',
    'New Delhi',
    'Delhi',
    'India',
    28.6139,
    77.2090,
    ARRAY['Nexon-Delhi-5G', 'Nexon-Delhi-Guest'],
    true
  ),
  (
    'Nexon Pune Office',
    '321 IT Park, Hinjewadi Phase 2',
    'Pune',
    'Maharashtra',
    'India',
    18.5204,
    73.8567,
    ARRAY['Nexon-Pune-5G', 'Nexon-Pune-Guest'],
    true
  ),
  (
    'Nexon Hyderabad Office',
    '654 Cyber Towers, HITEC City',
    'Hyderabad',
    'Telangana',
    'India',
    17.3850,
    78.4867,
    ARRAY['Nexon-Hyderabad-5G', 'Nexon-Hyderabad-Guest'],
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment these to verify setup:

-- Check all tables created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('profiles', 'offices', 'employee_requests', 'attendance')
-- ORDER BY table_name;

-- Check RLS enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'offices', 'employee_requests', 'attendance')
-- ORDER BY tablename;

-- Check offices inserted
-- SELECT id, name, city, state, is_active FROM offices ORDER BY name;

-- Check indexes created
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'offices', 'employee_requests', 'attendance')
-- ORDER BY tablename, indexname;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Next Steps:
-- 1. Create an admin user in Supabase Auth (Authentication > Users > Add User)
-- 2. Add admin profile using the SQL below (replace USER_ID with actual ID)
-- 3. Start using the application

-- Example: Create Admin Profile
-- INSERT INTO profiles (id, email, full_name, role, status, office_location)
-- VALUES (
--   'REPLACE_WITH_USER_ID_FROM_AUTH',
--   'admin@nexon.com',
--   'Admin User',
--   'admin',
--   'active',
--   (SELECT id FROM offices WHERE name LIKE '%Bangalore%' LIMIT 1)
-- );

-- ============================================
-- DATABASE SCHEMA SUMMARY
-- ============================================
--
-- Tables Created:
-- 1. profiles - User profiles with role and status
-- 2. offices - Office locations with geolocation
-- 3. employee_requests - Registration approval
-- 4. attendance - Daily attendance records with check-in/out 