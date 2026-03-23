-- Ensure work_applications_allowed field exists and has correct values

-- Add the column if it doesn't exist (safe operation)
ALTER TABLE employee_specific_holidays 
ADD COLUMN IF NOT EXISTS work_applications_allowed BOOLEAN DEFAULT false;

ALTER TABLE employee_recurring_holidays 
ADD COLUMN IF NOT EXISTS work_applications_allowed BOOLEAN DEFAULT false;

-- Check current values
SELECT 
    'employee_specific_holidays' as table_name,
    holiday_date,
    reason,
    work_applications_allowed,
    COUNT(*) as employee_count
FROM employee_specific_holidays 
WHERE holiday_date >= CURRENT_DATE
GROUP BY holiday_date, reason, work_applications_allowed
ORDER BY holiday_date

UNION ALL

SELECT 
    'employee_recurring_holidays' as table_name,
    day_of_week::text as holiday_date,
    'Recurring' as reason,
    work_applications_allowed,
    COUNT(*) as employee_count
FROM employee_recurring_holidays 
GROUP BY day_of_week, work_applications_allowed
ORDER BY day_of_week;