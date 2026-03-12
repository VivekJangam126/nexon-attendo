-- Initialize leave balance for all employees for current year
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

-- Verify the initialization
SELECT 
  p.full_name,
  lt.name,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.year
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;
