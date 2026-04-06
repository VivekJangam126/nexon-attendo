-- ================================================================
-- VERIFY NAINESH'S PROFILE AND BALANCE
-- ================================================================

-- Step 1: Check Nainesh's gender
SELECT id, full_name, email, gender, role FROM profiles WHERE full_name LIKE '%Nainesh%';

-- Step 2: Check if Nainesh has ALL 3 leave balances
SELECT 
  COUNT(*) as total_balance_records,
  COUNT(CASE WHEN lt.name = 'Sick Leave' THEN 1 END) as sick_leave_count,
  COUNT(CASE WHEN lt.name = 'Casual Leave' THEN 1 END) as casual_count,
  COUNT(CASE WHEN lt.name = 'My Leave' THEN 1 END) as my_leave_count
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name LIKE '%Nainesh%';

-- Step 3: Show the actual My Leave balance record
SELECT 
  p.full_name,
  lt.name,
  lt.id as leave_type_id,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.leave_type_id as stored_uuid
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name LIKE '%Nainesh%'
  AND lt.name = 'My Leave';

-- Step 4: Show what the API would return
SELECT
  elb.id,
  elb.employee_id,
  elb.leave_type_id,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.year,
  elb.leave_type_id as leave_type_id_test,
  lt.id as leave_type_object_id,
  lt.name as leave_type_name
FROM employee_leave_balance elb
LEFT JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE elb.employee_id = (SELECT id FROM profiles WHERE full_name LIKE '%Nainesh%' LIMIT 1)
ORDER BY lt.name;
