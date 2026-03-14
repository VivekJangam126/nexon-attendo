-- Reset employee leave balance after deleting leave requests
-- This script recalculates the balance based on actual approved leave requests

-- Step 1: Check current balance state
SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- Step 2: Recalculate used leaves based on actual approved requests
-- This will show what the used_leaves SHOULD be
SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  COALESCE(SUM((lr.end_date::date - lr.start_date::date) + 1), 0) as actual_used_leaves,
  elb.total_leaves - COALESCE(SUM((lr.end_date::date - lr.start_date::date) + 1), 0) as should_be_remaining
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
LEFT JOIN leave_requests lr ON lr.employee_id = elb.employee_id 
  AND lr.leave_type_id = elb.leave_type_id 
  AND lr.status = 'approved'
GROUP BY p.full_name, lt.name, elb.total_leaves, elb.id
ORDER BY p.full_name, lt.name;

-- Step 3: Update all balances to match actual approved leaves
UPDATE employee_leave_balance elb
SET 
  used_leaves = COALESCE(
    (SELECT SUM((lr.end_date::date - lr.start_date::date) + 1)
     FROM leave_requests lr
     WHERE lr.employee_id = elb.employee_id
       AND lr.leave_type_id = elb.leave_type_id
       AND lr.status = 'approved'
    ), 0
  ),
  remaining_leaves = elb.total_leaves - COALESCE(
    (SELECT SUM((lr.end_date::date - lr.start_date::date) + 1)
     FROM leave_requests lr
     WHERE lr.employee_id = elb.employee_id
       AND lr.leave_type_id = elb.leave_type_id
       AND lr.status = 'approved'
    ), 0
  ),
  updated_at = NOW();

-- Step 4: Verify the update
SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  (SELECT COUNT(*) 
   FROM leave_requests lr 
   WHERE lr.employee_id = elb.employee_id 
     AND lr.leave_type_id = elb.leave_type_id 
     AND lr.status = 'approved'
  ) as approved_requests_count
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;
