-- Ensure all employees have exactly 3 leave types: Paid Leave, Unpaid Leave, Sick Leave
-- This script will standardize the leave types and ensure every employee has all 3

-- Step 1: Check current leave types
SELECT id, name, max_per_year FROM leave_types ORDER BY name;

-- Step 2: Delete old leave types we don't want (Annual Leave, Compassionate Leave)
DELETE FROM leave_types WHERE name IN ('Annual Leave', 'Compassionate Leave');

-- Step 3: Ensure we have exactly these 3 leave types with correct names
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Paid Leave', 10),
  ('Unpaid Leave', 10),
  ('Sick Leave', 5)
ON CONFLICT (name) DO UPDATE SET
  max_per_year = EXCLUDED.max_per_year;

-- Step 4: Get the IDs of our 3 leave types
DO $$
DECLARE
  paid_leave_id UUID;
  unpaid_leave_id UUID;
  sick_leave_id UUID;
  emp_record RECORD;
BEGIN
  -- Get leave type IDs
  SELECT id INTO paid_leave_id FROM leave_types WHERE name = 'Paid Leave';
  SELECT id INTO unpaid_leave_id FROM leave_types WHERE name = 'Unpaid Leave';
  SELECT id INTO sick_leave_id FROM leave_types WHERE name = 'Sick Leave';

  -- For each active employee
  FOR emp_record IN 
    SELECT id, created_at FROM profiles WHERE role = 'employee' AND status = 'active'
  LOOP
    -- Insert Paid Leave if not exists
    INSERT INTO employee_leave_balance (
      employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, 
      year, employment_year_start, employment_year_end
    )
    VALUES (
      emp_record.id, paid_leave_id, 10, 0, 10,
      EXTRACT(YEAR FROM CURRENT_DATE),
      DATE_TRUNC('year', emp_record.created_at)::DATE,
      (DATE_TRUNC('year', emp_record.created_at) + INTERVAL '1 year' - INTERVAL '1 day')::DATE
    )
    ON CONFLICT (employee_id, leave_type_id, employment_year_start) 
    DO UPDATE SET
      total_leaves = 10,
      remaining_leaves = GREATEST(employee_leave_balance.remaining_leaves, 0);

    -- Insert Unpaid Leave if not exists
    INSERT INTO employee_leave_balance (
      employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, 
      year, employment_year_start, employment_year_end
    )
    VALUES (
      emp_record.id, unpaid_leave_id, 10, 0, 10,
      EXTRACT(YEAR FROM CURRENT_DATE),
      DATE_TRUNC('year', emp_record.created_at)::DATE,
      (DATE_TRUNC('year', emp_record.created_at) + INTERVAL '1 year' - INTERVAL '1 day')::DATE
    )
    ON CONFLICT (employee_id, leave_type_id, employment_year_start) 
    DO UPDATE SET
      total_leaves = 10,
      remaining_leaves = GREATEST(employee_leave_balance.remaining_leaves, 0);

    -- Insert Sick Leave if not exists
    INSERT INTO employee_leave_balance (
      employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, 
      year, employment_year_start, employment_year_end
    )
    VALUES (
      emp_record.id, sick_leave_id, 5, 0, 5,
      EXTRACT(YEAR FROM CURRENT_DATE),
      DATE_TRUNC('year', emp_record.created_at)::DATE,
      (DATE_TRUNC('year', emp_record.created_at) + INTERVAL '1 year' - INTERVAL '1 day')::DATE
    )
    ON CONFLICT (employee_id, leave_type_id, employment_year_start) 
    DO UPDATE SET
      total_leaves = 5,
      remaining_leaves = GREATEST(employee_leave_balance.remaining_leaves, 0);
  END LOOP;
END $$;

-- Step 5: Verify - Every employee should have exactly 3 leave types
SELECT 
  p.full_name,
  p.email,
  COUNT(DISTINCT elb.leave_type_id) as leave_types_count,
  STRING_AGG(lt.name || ': ' || elb.remaining_leaves || '/' || elb.total_leaves, ', ' ORDER BY lt.name) as leave_balances
FROM profiles p
LEFT JOIN employee_leave_balance elb ON p.id = elb.employee_id
LEFT JOIN leave_types lt ON elb.leave_type_id = lt.id
WHERE p.role = 'employee' AND p.status = 'active'
GROUP BY p.id, p.full_name, p.email
ORDER BY leave_types_count, p.full_name;

-- Step 6: Show final leave types
SELECT id, name, max_per_year FROM leave_types ORDER BY name;

-- Step 7: Show detailed balances
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
