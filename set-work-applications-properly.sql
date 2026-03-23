-- First, add the column if it doesn't exist
ALTER TABLE employee_specific_holidays 
ADD COLUMN IF NOT EXISTS work_applications_allowed BOOLEAN DEFAULT false;

ALTER TABLE employee_recurring_holidays 
ADD COLUMN IF NOT EXISTS work_applications_allowed BOOLEAN DEFAULT false;

-- Set specific holidays based on your requirements
-- Dr. Babasaheb Ambedkar Jayanti - allow work applications
UPDATE employee_specific_holidays 
SET work_applications_allowed = true 
WHERE reason ILIKE '%babasaheb%' OR reason ILIKE '%ambedkar%';

-- Maharashtra Day - allow work applications  
UPDATE employee_specific_holidays 
SET work_applications_allowed = true 
WHERE reason ILIKE '%maharashtra%';

-- Muharram - do NOT allow work applications (mandatory holiday)
UPDATE employee_specific_holidays 
SET work_applications_allowed = false 
WHERE reason ILIKE '%muharram%';

-- Check the results
SELECT 
    holiday_date,
    reason,
    work_applications_allowed,
    COUNT(*) as employee_count
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
GROUP BY holiday_date, reason, work_applications_allowed
ORDER BY holiday_date;