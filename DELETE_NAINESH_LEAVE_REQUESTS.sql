-- Remove All Leave Request History for Nainesh
-- This will delete all leave requests for Nainesh

-- Step 1: Find Nainesh's employee ID and show current leave requests
SELECT 'Nainesh Leave Requests Before Deletion' as step,
       p.id, p.full_name,
       lr.id as request_id,
       lr.start_date,
       lr.end_date,
       lr.status,
       lr.created_at
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
WHERE p.full_name ILIKE '%nainesh%'
ORDER BY lr.created_at DESC;

-- Step 2: Delete all leave requests for Nainesh
DELETE FROM leave_requests 
WHERE employee_id = (SELECT id FROM profiles WHERE full_name ILIKE '%nainesh%');

-- Step 3: Verify deletion - should show no results
SELECT 'Nainesh Leave Requests After Deletion' as step,
       p.full_name,
       COUNT(*) as total_requests
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
WHERE p.full_name ILIKE '%nainesh%'
GROUP BY p.full_name;

-- Step 4: Confirm - show all of Nainesh's current data
SELECT 'Nainesh Current Status' as step,
       p.full_name,
       p.email,
       (SELECT COUNT(*) FROM leave_requests WHERE employee_id = p.id) as leave_requests_count,
       (SELECT COUNT(*) FROM employee_leave_balance WHERE employee_id = p.id) as leave_balances_count
FROM profiles p
WHERE p.full_name ILIKE '%nainesh%';
