-- Remove duplicate leave balance records
-- Keep only the most recent record for each employee/leave_type combination

-- Step 1: Check for duplicates
SELECT 
  p.full_name,
  lt.name as leave_type,
  COUNT(*) as duplicate_count
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
GROUP BY p.full_name, lt.name, elb.employee_id, elb.leave_type_id
HAVING COUNT(*) > 1
ORDER BY p.full_name, lt.name;

-- Step 2: Delete duplicates, keeping only the most recent record
DELETE FROM employee_leave_balance a
USING employee_leave_balance b
WHERE a.id < b.id
  AND a.employee_id = b.employee_id
  AND a.leave_type_id = b.leave_type_id;

-- Step 3: Verify no duplicates remain
SELECT 
  p.full_name,
  lt.name as leave_type,
  COUNT(*) as count
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
GROUP BY p.full_name, lt.name, elb.employee_id, elb.leave_type_id
HAVING COUNT(*) > 1
ORDER BY p.full_name, lt.name;

-- Step 4: Verify each employee has exactly 3 leave types
SELECT 
  p.full_name,
  p.email,
  COUNT(DISTINCT elb.leave_type_id) as leave_types_count,
  STRING_AGG(lt.name, ', ' ORDER BY lt.name) as leave_types
FROM profiles p
LEFT JOIN employee_leave_balance elb ON p.id = elb.employee_id
LEFT JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.role = 'employee' AND p.status = 'active'
GROUP BY p.id, p.full_name, p.email
ORDER BY leave_types_count DESC, p.full_name;

-- Step 5: Show final clean data
SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.status = 'active'
ORDER BY p.full_name, 
  CASE lt.name 
    WHEN 'Paid Leave' THEN 1
    WHEN 'Unpaid Leave' THEN 2
    WHEN 'Sick Leave' THEN 3
  END;
