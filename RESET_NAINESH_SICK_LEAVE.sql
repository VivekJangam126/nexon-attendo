-- Reset Sick Leave Balance for Nainesh to 6 days
-- This will reset the sick leave balance and used leaves to 0

-- Find Nainesh's employee ID
SELECT 'Nainesh Profile' as step,
       id, full_name, email
FROM profiles 
WHERE full_name ILIKE '%nainesh%';

-- Reset Nainesh's Sick Leave balance
UPDATE employee_leave_balance 
SET 
  total_leaves = 6,
  used_leaves = 0,
  remaining_leaves = 6,
  updated_at = NOW()
WHERE 
  employee_id = (SELECT id FROM profiles WHERE full_name ILIKE '%nainesh%')
  AND leave_type_id = '33333333-3333-3333-3333-333333333333' -- Sick Leave ID
  AND year = EXTRACT(YEAR FROM NOW())::integer;

-- Verify the reset
SELECT 'Nainesh Sick Leave After Reset' as step,
       p.full_name,
       lt.name as leave_type,
       elb.total_leaves,
       elb.used_leaves,
       elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name ILIKE '%nainesh%'
  AND lt.id = '33333333-3333-3333-3333-333333333333'
  AND year = EXTRACT(YEAR FROM NOW())::integer;
