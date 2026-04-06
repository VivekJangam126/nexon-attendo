-- ================================================================
-- INSERT PROPER LEAVE TYPES WITH CORRECT IDs
-- ================================================================
-- Run this in Supabase SQL Editor to fix the foreign key issue

-- Step 1: Clear out old leave types and start fresh
TRUNCATE TABLE leave_types CASCADE;

-- Step 2: Insert all leave types with matching IDs from frontend
INSERT INTO leave_types (id, name, max_per_year) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Sick Leave', 6),
  ('44444444-4444-4444-4444-444444444444', 'Casual Leave', 19),
  ('55555555-5555-5555-5555-555555555555', 'My Leave', 12);

-- Step 3: CLEAR all existing leave balances first
TRUNCATE TABLE employee_leave_balance CASCADE;

-- Step 4: Initialize fresh leave balances for ALL employees
-- Get all unique employee IDs and create balances for each leave type
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
  EXTRACT(YEAR FROM NOW())::int as year,
  (EXTRACT(YEAR FROM NOW()) || '-01-01')::date as employment_year_start,
  (EXTRACT(YEAR FROM NOW()) || '-12-31')::date as employment_year_end
FROM profiles p
CROSS JOIN leave_types lt
WHERE p.role != 'admin';

-- Step 5: Verify the data was created
SELECT 'Leave Types' as check_name, COUNT(*) as count FROM leave_types 
UNION ALL
SELECT 'Employee Leave Balances', COUNT(*) FROM employee_leave_balance;

-- Step 6: Show leave type details
SELECT id, name, max_per_year FROM leave_types ORDER BY name;

-- Step 7: Show sample employee leave balances (first 10)
SELECT eb.employee_id, p.name, lt.name as leave_type, eb.total_leaves, eb.remaining_leaves
FROM employee_leave_balance eb
JOIN profiles p ON eb.employee_id = p.id
JOIN leave_types lt ON eb.leave_type_id = lt.id
ORDER BY p.name, lt.name
LIMIT 10;
