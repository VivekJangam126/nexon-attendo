-- Reset Leave Data for Nainesh
-- This will:
-- 1. Find Nainesh's user ID
-- 2. Delete all leave requests
-- 3. Reset leave balance to 0

-- Step 1: Find Nainesh's user ID
SELECT id, full_name, email FROM profiles WHERE full_name ILIKE '%nainesh%';

-- Step 2: Get Nainesh's user ID (replace with actual ID if needed)
-- UPDATE when you know the ID

-- Step 3: Delete all leave requests for Nainesh
DELETE FROM leave_requests 
WHERE employee_id = (SELECT id FROM profiles WHERE full_name ILIKE '%nainesh%')
RETURNING id, status, start_date, end_date;

-- Step 4: Reset leave balance for Nainesh (set used_leaves to 0, remaining_leaves to total_leaves)
UPDATE employee_leave_balance
SET 
  used_leaves = 0,
  remaining_leaves = total_leaves,
  updated_at = NOW()
WHERE employee_id = (SELECT id FROM profiles WHERE full_name ILIKE '%nainesh%')
RETURNING employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves;

-- Step 5: Verify deletion and reset
SELECT 
  'Leave Requests Deleted: ' as message,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'leave_requests';

SELECT 
  p.full_name,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  lt.name as leave_type
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name ILIKE '%nainesh%'
ORDER BY lt.name;

-- Step 6: Final count of leave requests for Nainesh
SELECT COUNT(*) as remaining_leave_requests
FROM leave_requests
WHERE employee_id = (SELECT id FROM profiles WHERE full_name ILIKE '%nainesh%');
