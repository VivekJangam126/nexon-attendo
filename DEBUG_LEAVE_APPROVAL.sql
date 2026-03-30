-- Debug Leave Approval Issue
-- This script helps diagnose why leave balance isn't updating after approval

-- 1. Check RLS policies on employee_leave_balance table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'employee_leave_balance';

-- 2. Check if the leave request was actually approved
SELECT 
    lr.id,
    p.full_name,
    lt.name as leave_type,
    lr.start_date,
    lr.end_date,
    (lr.end_date - lr.start_date + 1) as calculated_days,
    lr.status,
    lr.admin_comment,
    lr.updated_at
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE p.full_name ILIKE '%siddhesh%'
ORDER BY lr.updated_at DESC
LIMIT 3;

-- 3. Check current leave balance
SELECT 
    elb.id,
    p.full_name,
    lt.name as leave_type,
    elb.total_leaves,
    elb.used_leaves,
    elb.remaining_leaves,
    elb.year,
    elb.updated_at
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name ILIKE '%siddhesh%'
ORDER BY lt.name;

-- 4. Manually update the balance (if needed)
-- Uncomment and run this if the balance is stuck
/*
UPDATE employee_leave_balance
SET 
    used_leaves = 3,
    remaining_leaves = total_leaves - 3,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM profiles WHERE full_name ILIKE '%siddhesh%' LIMIT 1)
  AND leave_type_id = (SELECT id FROM leave_types WHERE name = 'Sick Leave' LIMIT 1);
*/

-- 5. Verify the update
SELECT 
    elb.id,
    p.full_name,
    lt.name as leave_type,
    elb.total_leaves,
    elb.used_leaves,
    elb.remaining_leaves,
    elb.updated_at
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name ILIKE '%siddhesh%'
ORDER BY lt.name;
