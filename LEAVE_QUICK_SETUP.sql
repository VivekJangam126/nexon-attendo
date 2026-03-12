-- LEAVE MANAGEMENT SYSTEM - QUICK SETUP SQL
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  max_per_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employee_leave_balance (
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

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

CREATE INDEX idx_employee_leave_balance_employee_id ON employee_leave_balance(employee_id);
CREATE INDEX idx_employee_leave_balance_year ON employee_leave_balance(year);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- STEP 3: INSERT DEFAULT DATA
-- ============================================

-- Insert leave types
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Annual Leave', 22),
  ('Sick Leave', 12),
  ('Compassionate Leave', 3),
  ('Unpaid Leave', 0);

-- Insert leave policies
INSERT INTO leave_policies (title, description) VALUES
  ('SICK LEAVE RULES', 'Up to 90 days/year: 15 full pay, 30 half pay, 45 unpaid.'),
  ('CARRY FORWARD', 'Max 5 days annual leave can be carried to next year.'),
  ('COMPASSIONATE', '3 days paid for immediate family emergencies.');

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
-- STEP 6: INITIALIZE LEAVE BALANCE
-- ============================================

-- Initialize leave balance for all active employees
INSERT INTO employee_leave_balance (employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, year)
SELECT 
  p.id,
  lt.id,
  lt.max_per_year,
  0,
  lt.max_per_year,
  EXTRACT(YEAR FROM NOW())::INTEGER
FROM profiles p
CROSS JOIN leave_types lt
WHERE p.role = 'employee'
  AND p.status = 'active'
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

-- ============================================
-- STEP 7: VERIFY SETUP
-- ============================================

-- Check leave types
SELECT 'Leave Types' as section, COUNT(*) as count FROM leave_types;

-- Check leave policies
SELECT 'Leave Policies' as section, COUNT(*) as count FROM leave_policies;

-- Check employee leave balance
SELECT 'Employee Leave Balance' as section, COUNT(*) as count FROM employee_leave_balance;

-- Show leave balance details
SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.year
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- ============================================
-- DONE! ✅
-- ============================================
-- The Leave Management System is now ready to use.
-- 
-- Next steps:
-- 1. Login as Employee
-- 2. Go to Leave Management
-- 3. Check if leave types appear in dropdown
-- 4. Check if leave balance shows correctly
-- 5. Try applying for leave
-- 6. Login as Admin
-- 7. Go to Admin > Leave Management
-- 8. Approve/Reject leave requests
