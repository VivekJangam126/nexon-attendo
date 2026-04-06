-- ================================================================
-- CLEAR ALL LEAVES & LEAVE REQUESTS FOR NAINESH
-- ================================================================

-- Step 1: Get Nainesh's ID
WITH nainesh AS (
  SELECT id FROM profiles WHERE full_name LIKE '%Nainesh%' LIMIT 1
)

-- Step 2: Delete ALL leave requests for Nainesh
DELETE FROM leave_requests
WHERE employee_id = (SELECT id FROM nainesh);

-- Step 3: Reset Nainesh's leave balances to 0 used, full remaining
WITH nainesh AS (
  SELECT id FROM profiles WHERE full_name LIKE '%Nainesh%' LIMIT 1
)
UPDATE employee_leave_balance SET
  used_leaves = 0,
  remaining_leaves = total_leaves,
  updated_at = NOW()
WHERE employee_id = (SELECT id FROM nainesh);

-- Step 4: Verify - Show Nainesh's balances after clearing
SELECT 
  p.full_name,
  lt.name,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name LIKE '%Nainesh%'
ORDER BY lt.name;

-- Step 5: Verify - Show all leave requests (should be empty for Nainesh)
SELECT 
  p.full_name,
  lr.status,
  lt.name as leave_type,
  lr.start_date,
  lr.end_date,
  lr.created_at
FROM leave_requests lr
JOIN leave_types lt ON lr.leave_type_id = lt.id
JOIN profiles p ON lr.employee_id = p.id
WHERE p.full_name LIKE '%Nainesh%'
ORDER BY lr.created_at DESC;
