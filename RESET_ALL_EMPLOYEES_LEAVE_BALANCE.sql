-- Reset Leave Balance to Full for ALL EMPLOYEES
-- This script resets all leave balances to show full remaining leaves for every employee
-- Use this when leave requests are deleted and balance needs to be recalculated

-- First, let's see current leave balance for ALL employees
SELECT 
    elb.id,
    p.full_name,
    lt.name as leave_type,
    elb.total_leaves,
    elb.used_leaves,
    elb.remaining_leaves,
    elb.created_at,
    elb.updated_at
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- Reset ALL leave balances to full (used_leaves = 0, remaining_leaves = total_leaves)
UPDATE employee_leave_balance 
SET 
    used_leaves = 0,
    remaining_leaves = total_leaves,
    updated_at = NOW();

-- Verify the update for ALL employees
SELECT 
    elb.id,
    p.full_name,
    lt.name as leave_type,
    elb.total_leaves,
    elb.used_leaves,
    elb.remaining_leaves,
    elb.created_at,
    elb.updated_at
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- Check if there are any approved leave requests that should be counted
SELECT 
    lr.id,
    p.full_name,
    lt.name as leave_type,
    (lr.end_date - lr.start_date + 1) as leave_days,
    lr.status,
    lr.start_date,
    lr.end_date,
    lr.created_at
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.status = 'approved'
ORDER BY p.full_name, lr.created_at DESC;
