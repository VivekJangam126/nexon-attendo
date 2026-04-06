-- ================================================================
-- COMPREHENSIVE FIX: FIND & REPLACE INCORRECT MY LEAVE UUID IN BALANCE
-- ================================================================

-- Step 1: Find what leave_type_id Nainesh's My Leave balance is currently using
SELECT 
  elb.id as balance_id,
  elb.leave_type_id as wrong_id,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  p.full_name
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
WHERE p.full_name LIKE '%Nainesh%'
  AND elb.total_leaves = 12  -- My Leave has 12 total
  AND elb.leave_type_id NOT IN (
    SELECT id FROM leave_types WHERE name = 'Sick Leave'
  )
  AND elb.leave_type_id NOT IN (
    SELECT id FROM leave_types WHERE name = 'Casual Leave'
  );

-- Step 2: Delete any wrong My Leave balance records for Nainesh
DELETE FROM employee_leave_balance
WHERE employee_id = (SELECT id FROM profiles WHERE full_name LIKE '%Nainesh%' LIMIT 1)
  AND total_leaves = 12
  AND leave_type_id != '55555555-5555-5555-5555-555555555555';

-- Step 3: Create/Update Nainesh's My Leave balance with CORRECT UUID
WITH nainesh AS (
  SELECT id FROM profiles WHERE full_name LIKE '%Nainesh%' LIMIT 1
)
INSERT INTO employee_leave_balance (
  employee_id,
  leave_type_id,
  total_leaves,
  used_leaves,
  remaining_leaves,
  year,
  employment_year_start,
  employment_year_end
)
SELECT 
  n.id,
  '55555555-5555-5555-5555-555555555555'::uuid,
  12,
  1,
  11,
  EXTRACT(YEAR FROM NOW())::int,
  (EXTRACT(YEAR FROM NOW()) || '-01-01')::date,
  (EXTRACT(YEAR FROM NOW()) || '-12-31')::date
FROM nainesh n
ON CONFLICT (employee_id, leave_type_id) DO UPDATE SET
  used_leaves = 1,
  remaining_leaves = 11,
  updated_at = NOW();

-- Step 4: VERIFY - Show all Nainesh's balances with correct UUIDs
SELECT 
  p.full_name,
  lt.name,
  elb.leave_type_id,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name LIKE '%Nainesh%'
ORDER BY lt.name;
