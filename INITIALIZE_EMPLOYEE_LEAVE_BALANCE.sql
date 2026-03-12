-- Initialize leave balance for all active employees for current year
-- This ensures each employee has their own leave balance records

-- First, delete any existing records to avoid duplicates
DELETE FROM employee_leave_balance 
WHERE year = EXTRACT(YEAR FROM NOW())::INTEGER;

-- Insert fresh leave balance records for each employee and leave type
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
