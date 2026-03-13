-- LEAVE ANNIVERSARY RESET SYSTEM
-- Implements automatic leave balance reset every employment year
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: ADD ANNIVERSARY TRACKING COLUMNS
-- ============================================

ALTER TABLE employee_leave_balance 
ADD COLUMN IF NOT EXISTS employment_year_start DATE,
ADD COLUMN IF NOT EXISTS employment_year_end DATE;

-- ============================================
-- STEP 2: UPDATE EXISTING RECORDS
-- ============================================

-- Update existing records to track their employment year
-- Uses employee's registration date as the start of their employment year
UPDATE employee_leave_balance elb
SET employment_year_start = DATE(p.created_at),
    employment_year_end = DATE(p.created_at) + INTERVAL '1 year'
FROM profiles p
WHERE elb.employee_id = p.id
AND elb.employment_year_start IS NULL;

-- ============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employment_year_start 
  ON employee_leave_balance(employee_id, employment_year_start);

CREATE INDEX IF NOT EXISTS idx_employment_year_end 
  ON employee_leave_balance(employee_id, employment_year_end);

-- ============================================
-- STEP 4: VERIFY THE UPDATE
-- ============================================

SELECT 
  p.full_name,
  lt.name as leave_type,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves,
  elb.employment_year_start,
  elb.employment_year_end
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- ============================================
-- HOW IT WORKS
-- ============================================
-- 1. Employee enrolls on a specific date (e.g., March 12, 2026)
-- 2. Gets initial balance: Sick(5), Paid(10), Unpaid(10)
-- 3. Record tracks: employment_year_start = March 12, 2026
--                   employment_year_end = March 12, 2027
-- 4. On anniversary (March 12, 2027):
--    - Old records archived/kept for historical data
--    - New balance created for new employment year (March 12, 2027 - March 12, 2028)
--    - All leaves reset to 0 used, max remaining
-- 5. System checks on every leave operation
