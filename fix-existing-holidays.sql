-- First, check if the work_applications_allowed column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employee_specific_holidays' 
AND column_name = 'work_applications_allowed';

-- If the column doesn't exist, add it
ALTER TABLE employee_specific_holidays 
ADD COLUMN IF NOT EXISTS work_applications_allowed BOOLEAN DEFAULT true;

ALTER TABLE employee_recurring_holidays 
ADD COLUMN IF NOT EXISTS work_applications_allowed BOOLEAN DEFAULT true;

-- Update all existing holidays to allow work applications
UPDATE employee_specific_holidays 
SET work_applications_allowed = true 
WHERE work_applications_allowed IS NULL OR work_applications_allowed = false;

UPDATE employee_recurring_holidays 
SET work_applications_allowed = true 
WHERE work_applications_allowed IS NULL OR work_applications_allowed = false;

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