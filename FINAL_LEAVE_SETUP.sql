-- FINAL LEAVE TYPES SETUP
-- Run this in Supabase SQL Editor to update leave types to match requirements
-- Total allocation: 25 days (Annual: 25, Sick: 5, Paid: 10, Unpaid: 10)
-- Note: Annual Leave is hidden from the ApplyLeaveModal form

-- Step 1: Delete existing leave types (if starting fresh)
-- UNCOMMENT ONLY IF STARTING FROM SCRATCH
-- DELETE FROM leave_requests;
-- DELETE FROM employee_leave_balance;
-- DELETE FROM leave_types;

-- Step 2: Insert/Update leave types with correct allocations
-- Using UPSERT (ON CONFLICT) to safely update existing records
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Annual Leave', 25),
  ('Sick Leave', 5),
  ('Paid Leave', 10),
  ('Unpaid Leave', 10)
ON CONFLICT (name) DO UPDATE SET
  max_per_year = EXCLUDED.max_per_year;

-- Step 3: Verify the setup
SELECT id, name, max_per_year FROM leave_types ORDER BY name;

-- Step 4: Summary of configuration
-- Total annual leave allocation: 25 days
-- - Annual Leave: 25 (tracked but hidden from form selection)
-- - Sick Leave: 5 (selectable)
-- - Paid Leave: 10 (selectable)
-- - Unpaid Leave: 10 (selectable)
-- 
-- Balance calculation behavior:
-- 1. When employee APPLIES for leave -> status = 'pending', balance unchanged
-- 2. When admin APPROVES leave -> status = 'approved', balance updated
--    - used_leaves += number_of_days
--    - remaining_leaves = total_leaves - used_leaves
-- 3. When admin REJECTS leave -> status = 'rejected', balance unchanged
--
-- Note: Annual Leave is included in leave_types table for future use/reporting
-- but is filtered out in ApplyLeaveModal.tsx line:
-- {leaveTypes.filter(type => type.name !== 'Annual Leave').map((type) => {
