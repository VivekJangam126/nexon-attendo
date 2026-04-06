-- ================================================================
-- MANUALLY RECALCULATE & UPDATE NAINESH'S LEAVE BALANCE
-- ================================================================
-- This query will force-update the balance by counting approved leaves

-- Step 1: Get Nainesh's ID
WITH nainesh_id AS (
  SELECT id FROM profiles WHERE full_name LIKE '%Nainesh%' LIMIT 1
),

-- Step 2: Count how many days of each leave type Nainesh has used (approved leaves only)
leave_usage AS (
  SELECT 
    lr.leave_type_id,
    COALESCE(SUM(
      (lr.end_date::date - lr.start_date::date) + 1
    ), 0)::int as total_days_used
  FROM leave_requests lr
  WHERE lr.employee_id = (SELECT id FROM nainesh_id)
    AND lr.status = 'approved'
    AND EXTRACT(YEAR FROM lr.start_date::date) = EXTRACT(YEAR FROM NOW())
  GROUP BY lr.leave_type_id
)

-- Step 3: Update each leave type balance for Nainesh
UPDATE employee_leave_balance elb
SET 
  used_leaves = COALESCE(lu.total_days_used, 0),
  remaining_leaves = elb.total_leaves - COALESCE(lu.total_days_used, 0),
  updated_at = NOW()
FROM nainesh_id ni
LEFT JOIN leave_usage lu ON elb.leave_type_id = lu.leave_type_id
WHERE elb.employee_id = ni.id;

-- Step 4: Verify the update
SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.updated_at
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.full_name LIKE '%Nainesh%'
ORDER BY lt.name;

-- Step 5: Show all Nainesh's approved leaves
SELECT 
  lt.name as leave_type,
  lr.start_date,
  lr.end_date,
  (lr.end_date::date - lr.start_date::date + 1)::int as days,
  lr.status
FROM leave_requests lr
JOIN leave_types lt ON lr.leave_type_id = lt.id
JOIN profiles p ON lr.employee_id = p.id
WHERE p.full_name LIKE '%Nainesh%'
  AND lr.status = 'approved'
ORDER BY lr.start_date DESC;
