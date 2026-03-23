-- Direct SQL fix for work_applications_allowed field
-- Run this in your database to enable work applications for all future holidays

-- Check current state
SELECT 
    id,
    employee_id,
    holiday_date,
    reason,
    work_applications_allowed,
    created_at
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
ORDER BY holiday_date;

-- Update all future holidays to allow work applications
UPDATE employee_specific_holidays 
SET work_applications_allowed = true 
WHERE holiday_date >= CURRENT_DATE;

-- Verify the update worked
SELECT 
    id,
    employee_id,
    holiday_date,
    reason,
    work_applications_allowed,
    created_at
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
ORDER BY holiday_date;

-- Count check
SELECT 
    work_applications_allowed,
    COUNT(*) as count
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
GROUP BY work_applications_allowed;