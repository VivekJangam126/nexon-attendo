-- ================================================================
-- DEBUG: CHECK MY LEAVE BALANCE UUID MISMATCH
-- ================================================================

-- Step 1: Check what UUID is in leave_types for "My Leave"
SELECT id, name, max_per_year 
FROM leave_types 
WHERE name = 'My Leave';

-- Step 2: Check what UUID is in Nainesh's balance for My Leave
SELECT 
  elb.id,
  elb.employee_id,
  elb.leave_type_id,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  p.full_name
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
WHERE p.full_name LIKE '%Nainesh%'
ORDER BY elb.leave_type_id;

-- Step 3: Show ALL leave types to see if there are duplicates
SELECT id, name, max_per_year 
FROM leave_types 
ORDER BY name;

-- Step 4: Check if there are multiple "My Leave" entries
SELECT COUNT(*) as my_leave_count 
FROM leave_types 
WHERE name = 'My Leave';

-- Step 5: If there are multiple, delete the wrong ones and keep the correct UUID
-- This will show us which ones exist
SELECT id, name FROM leave_types WHERE name LIKE '%My%';
