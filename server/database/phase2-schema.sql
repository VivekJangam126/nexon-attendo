-- Phase 2: Employee Registration & Admin Approval
-- Database Schema and RLS Policies

-- ============================================
-- 1. OFFICES TABLE
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

-- Enable RLS
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active offices (for registration)
CREATE POLICY "Anyone can read active offices"
  ON offices FOR SELECT
  USING (is_active = true);

-- Policy: Admins can read all offices
CREATE POLICY "Admins can read all offices"
  ON offices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can manage offices
CREATE POLICY "Admins can manage offices"
  ON offices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. EMPLOYEE_REQUESTS TABLE
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

-- Enable RLS
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own request
CREATE POLICY "Users can read own request"
  ON employee_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can read all requests
CREATE POLICY "Admins can read all requests"
  ON employee_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update requests
CREATE POLICY "Admins can update requests"
  ON employee_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert requests (during registration)
CREATE POLICY "System can insert requests"
  ON employee_requests FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 3. UPDATE PROFILES TABLE RLS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert profiles (during registration)
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_requests_user_id ON employee_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_office_id ON employee_requests(office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_office_location ON profiles(office_location);

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. SAMPLE DATA (OPTIONAL)
-- ============================================

-- Insert sample offices
INSERT INTO offices (name, address, city, state, country, latitude, longitude, is_active)
VALUES
  ('Nexon HQ', '123 Tech Park, Sector 5', 'Bangalore', 'Karnataka', 'India', 12.9716, 77.5946, true),
  ('Nexon Mumbai Office', '456 Business Center, Andheri', 'Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777, true),
  ('Nexon Delhi Office', '789 Corporate Plaza, Connaught Place', 'New Delhi', 'Delhi', 'India', 28.6139, 77.2090, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- PHASE 2 SCHEMA COMPLETE
-- ============================================
