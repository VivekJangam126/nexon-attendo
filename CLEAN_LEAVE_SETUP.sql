-- CLEAN LEAVE BALANCE SETUP
-- This will reset and properly configure leave balances for all employees

-- Step 1: Clear all existing leave balance data
TRUNCATE TABLE employee_leave_balance CASCADE;

-- Step 2: Clear and reset leave types
TRUNCATE TABLE leave_types CASCADE;

-- Step 3: Insert exactly 3 leave types
INSERT INTO leave_types (id, name, max_per_year) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Paid Leave', 10),
  ('22222222-2222-2222-2222-222222222222', 'Unpaid Leave', 10),
  ('33333333-3333-3333-3333-333333333333', 'Sick Leave', 5);

-- Step 4: Insert leave balances for ALL active employees
INSERT INTO employee_leave_balance (
  employee_id,
  leave_type_id,
  total_leaves,
  used_leaves,
  remaining_leaves,
  year,
  employment_year_start,
  employment_year_end
)
SELECT 
  p.id,
  lt.id,
  lt.max_per_year,
  0,
  lt.max_per_year,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  DATE_TRUNC('year', CURRENT_DATE)::DATE,
  (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day')::DATE
FROM profiles p
CROSS JOIN leave_types lt
WHERE p.role = 'employee' AND p.status = 'active';

-- Step 5: Verify setup
SELECT 
  'Total Employees' as metric,
  COUNT(DISTINCT employee_id) as count
FROM employee_leave_balance
UNION ALL
SELECT 
  'Total Balance Records' as metric,
  COUNT(*) as count
FROM employee_leave_balance
UNION ALL
SELECT 
  'Expected Records (Employees × 3)' as metric,
  (SELECT COUNT(*) FROM profiles WHERE role = 'employee' AND status = 'active') * 3 as count;

-- Step 6: Show each employee's leave balances
SELECT 
  p.full_name,
  p.email,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.status = 'active'
ORDER BY p.full_name, 
  CASE lt.name 
    WHEN 'Paid Leave' THEN 1
    WHEN 'Unpaid Leave' THEN 2
    WHEN 'Sick Leave' THEN 3
  END;

-- Step 7: Verify each employee has exactly 3 leave types
SELECT 
  p.full_name,
  COUNT(elb.id) as leave_balance_count
FROM profiles p
LEFT JOIN employee_leave_balance elb ON p.id = elb.employee_id
WHERE p.role = 'employee' AND p.status = 'active'
GROUP BY p.id, p.full_name
HAVING COUNT(elb.id) != 3
ORDER BY p.full_name;

-- If Step 7 returns no rows, setup is perfect!
