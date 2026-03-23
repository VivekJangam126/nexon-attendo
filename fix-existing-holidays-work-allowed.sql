-- Fix existing holidays to allow work applications

-- First, check current values
SELECT 
    holiday_date,
    reason,
    work_applications_allowed,
    COUNT(*) as employee_count
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
GROUP BY holiday_date, reason, work_applications_allowed
ORDER BY holiday_date;

-- Update Dr. Babasaheb Ambedkar Jayanti to allow work applications
UPDATE employee_specific_holidays 
SET work_applications_allowed = true 
WHERE reason ILIKE '%babasaheb%' OR reason ILIKE '%ambedkar%';

-- Update JI to Jindagi to allow work applications
UPDATE employee_specific_holidays 
SET work_applications_allowed = true 
WHERE reason ILIKE '%jindagi%' OR reason ILIKE '%JI to%';

-- Update any other holidays you want to allow work applications for
-- UPDATE employee_specific_holidays 
-- SET work_applications_allowed = true 
-- WHERE reason ILIKE '%your_holiday_name%';

-- Check the results after update
SELECT 
    holiday_date,
    reason,
    work_applications_allowed,
    COUNT(*) as employee_count
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
GROUP BY holiday_date, reason, work_applications_allowed
ORDER BY holiday_date;