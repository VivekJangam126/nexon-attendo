-- COMPLETE LEAVE MANAGEMENT SETUP
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

-- Create leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  max_per_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_leave_balance table
CREATE TABLE IF NOT EXISTS employee_leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  total_leaves INTEGER NOT NULL,
  used_leaves INTEGER NOT NULL DEFAULT 0,
  remaining_leaves INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Create leave_requests table with leave_type_id as NULLABLE
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_policies table
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_leave_balance_employee_id ON employee_leave_balance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balance_year ON employee_leave_balance(year);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- STEP 3: INSERT DEFAULT DATA
-- ============================================

-- Insert leave types (if not already present)
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Annual Leave', 22),
  ('Sick Leave', 12),
  ('Compassionate Leave', 3),
  ('Unpaid Leave', 0)
ON CONFLICT (name) DO NOTHING;

-- Insert leave policies (if not already present)
INSERT INTO leave_policies (title, description) VALUES
  ('SICK LEAVE RULES', 'Up to 90 days/year: 15 full pay, 30 half pay, 45 unpaid.'),
  ('CARRY FORWARD', 'Max 5 days annual leave can be carried to next year.'),
  ('COMPASSIONATE', '3 days paid for immediate family emergencies.')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: ENABLE RLS
-- ============================================

ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "leave_types_read" ON leave_types;
DROP POLICY IF EXISTS "employee_leave_balance_read_own" ON employee_leave_balance;
DROP POLICY IF EXISTS "employee_leave_balance_update_admin" ON employee_leave_balance;
DROP POLICY IF EXISTS "leave_requests_read_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_admin" ON leave_requests;
DROP POLICY IF EXISTS "leave_policies_read" ON leave_policies;

-- leave_types - public read
CREATE POLICY "leave_types_read" ON leave_types
  FOR SELECT USING (true);

-- employee_leave_balance - read own or admin
CREATE POLICY "employee_leave_balance_read_own" ON employee_leave_balance
  FOR SELECT USING (
    auth.uid() = employee_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "employee_leave_balance_update_admin" ON employee_leave_balance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- leave_requests - read own or admin
CREATE POLICY "leave_requests_read_own" ON leave_requests
  FOR SELECT USING (
    auth.uid() = employee_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "leave_requests_insert_own" ON leave_requests
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "leave_requests_update_own" ON leave_requests
  FOR UPDATE USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "leave_requests_update_admin" ON leave_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- leave_policies - public read
CREATE POLICY "leave_policies_read" ON leave_policies
  FOR SELECT USING (true);

-- ============================================
-- STEP 6: VERIFY SETUP
-- ============================================

SELECT 'Setup Complete!' as status;

-- Check table counts
SELECT 'leave_types' as table_name, COUNT(*) as count FROM leave_types
UNION ALL
SELECT 'leave_policies', COUNT(*) FROM leave_policies
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests
UNION ALL
SELECT 'employee_leave_balance', COUNT(*) FROM employee_leave_balance;
