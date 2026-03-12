-- ============================================
-- NEW LEAVE SYSTEM SETUP
-- Sick Leave: 5, Paid Leave: 10, Unpaid Leave: 10
-- ============================================

-- Step 1: Delete all existing leave types
DELETE FROM leave_types;

-- Step 2: Insert new leave types with correct allocations
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Sick Leave', 5),
  ('Paid Leave', 10),
  ('Unpaid Leave', 10);

-- Step 3: Verify leave types
SELECT id, name, max_per_year FROM leave_types ORDER BY name;

-- Step 4: Initialize leave balance for all active employees
INSERT INTO employee_leave_balance (employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, year)
SELECT 
  p.id as employee_id,
  lt.id as leave_type_id,
  lt.max_per_year as total_leaves,
  0 as used_leaves,
  lt.max_per_year as remaining_leaves,
  EXTRACT(YEAR FROM NOW())::INTEGER as year
FROM profiles p
CROSS JOIN leave_types lt
WHERE p.role = 'employee'
  AND p.status = 'active'
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

-- Step 5: Verify employee leave balance
SELECT 
  p.full_name,
  p.email,
  lt.name,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.year
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- Step 6: Count total employees with leave balance
SELECT 
  COUNT(DISTINCT elb.employee_id) as total_employees,
  COUNT(*) as total_balance_records
FROM employee_leave_balance elb;
