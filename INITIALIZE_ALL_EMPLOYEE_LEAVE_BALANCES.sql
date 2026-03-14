-- Initialize leave balances for ALL employees who don't have them
-- This script creates leave balance records for the current employment year

-- Step 1: Create a function to calculate employment year for an employee
CREATE OR REPLACE FUNCTION get_current_employment_year(enrollment_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE(year_start DATE, year_end DATE) AS $$
DECLARE
  enrollment DATE;
  today DATE;
  anniversary_start DATE;
  anniversary_end DATE;
BEGIN
  enrollment := enrollment_date::DATE;
  today := CURRENT_DATE;
  
  -- Start with enrollment date
  anniversary_start := enrollment;
  anniversary_end := enrollment + INTERVAL '1 year';
  
  -- Keep incrementing until we find the current employment year
  WHILE anniversary_end <= today LOOP
    anniversary_start := anniversary_end;
    anniversary_end := anniversary_end + INTERVAL '1 year';
  END LOOP;
  
  RETURN QUERY SELECT anniversary_start, anniversary_end::DATE;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Insert leave balances for employees who don't have them
-- Using DO NOTHING to skip duplicates instead of ON CONFLICT
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
  p.id as employee_id,
  lt.id as leave_type_id,
  lt.max_per_year as total_leaves,
  0 as used_leaves,
  lt.max_per_year as remaining_leaves,
  EXTRACT(YEAR FROM ey.year_start) as year,
  ey.year_start as employment_year_start,
  ey.year_end as employment_year_end
FROM profiles p
CROSS JOIN leave_types lt
CROSS JOIN LATERAL get_current_employment_year(p.created_at) ey
WHERE p.role = 'employee'
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM employee_leave_balance elb
    WHERE elb.employee_id = p.id
      AND elb.leave_type_id = lt.id
      AND elb.employment_year_start = ey.year_start
  );

-- Step 3: Show results
SELECT 
  'Initialization Complete!' as status,
  COUNT(DISTINCT employee_id) as employees_with_balance,
  COUNT(*) as total_balance_records
FROM employee_leave_balance;

-- Step 4: Show employees and their leave balances
SELECT 
  p.full_name,
  p.email,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.employment_year_start,
  elb.employment_year_end
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.status = 'active'
ORDER BY p.full_name, lt.name;

-- Step 5: Show employees WITHOUT leave balances (if any)
SELECT 
  p.full_name,
  p.email,
  p.created_at as enrollment_date,
  'Missing leave balance' as status
FROM profiles p
WHERE p.role = 'employee'
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM employee_leave_balance elb
    WHERE elb.employee_id = p.id
  )
ORDER BY p.full_name;
