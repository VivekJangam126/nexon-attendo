-- ============================================
-- VERIFICATION SCRIPT FOR NEW LEAVE SYSTEM
-- ============================================

-- 1. Check leave types are correct
SELECT 
  id,
  name,
  max_per_year,
  created_at
FROM leave_types
ORDER BY name;

-- Expected output:
-- Paid Leave | 10
-- Sick Leave | 5
-- Unpaid Leave | 10

-- 2. Check total employees with leave balance
SELECT 
  COUNT(DISTINCT employee_id) as total_employees_with_balance,
  COUNT(*) as total_balance_records
FROM employee_leave_balance;

-- Expected: Each employee should have 3 records (one for each leave type)

-- 3. Check leave balance for all employees
SELECT 
  p.full_name,
  p.email,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  CASE 
    WHEN elb.remaining_leaves = 0 THEN 'No leaves left'
    WHEN elb.remaining_leaves <= 2 THEN 'Running low'
    ELSE 'Healthy balance'
  END as status
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.role = 'employee' AND p.status = 'active'
ORDER BY p.full_name, lt.name;

-- 4. Check if there are any approved leave requests
SELECT 
  p.full_name,
  lt.name as leave_type,
  lr.start_date,
  lr.end_date,
  CEIL((lr.end_date::date - lr.start_date::date) + 1) as days,
  lr.status
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.status = 'approved'
ORDER BY p.full_name, lr.start_date DESC;

-- 5. Check for any leave requests with invalid leave types (should be empty)
SELECT 
  lr.id,
  lr.employee_id,
  lr.leave_type_id,
  lr.status
FROM leave_requests lr
WHERE lr.leave_type_id NOT IN (SELECT id FROM leave_types)
LIMIT 10;

-- Expected: No results (all leave requests should reference valid leave types)

-- 6. Summary statistics
SELECT 
  'Total Leave Types' as metric,
  COUNT(*)::text as value
FROM leave_types
UNION ALL
SELECT 
  'Total Employees',
  COUNT(DISTINCT employee_id)::text
FROM employee_leave_balance
UNION ALL
SELECT 
  'Total Leave Requests',
  COUNT(*)::text
FROM leave_requests
UNION ALL
SELECT 
  'Approved Requests',
  COUNT(*)::text
FROM leave_requests
WHERE status = 'approved'
UNION ALL
SELECT 
  'Pending Requests',
  COUNT(*)::text
FROM leave_requests
WHERE status = 'pending';
