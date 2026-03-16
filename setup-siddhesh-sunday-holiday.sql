-- Setup Sunday as a recurring holiday for Siddhesh
-- First check if it already exists
SELECT 'Current Recurring Holidays' as step, *
FROM employee_recurring_holidays 
WHERE employee_id = (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com');

-- Add Sunday (day 0) as a recurring holiday for Siddhesh
INSERT INTO employee_recurring_holidays (employee_id, day_of_week, created_at)
SELECT 
    id as employee_id,
    0 as day_of_week,  -- Sunday = 0
    NOW() as created_at
FROM profiles 
WHERE email = 'siddheshjabhav7@devconsoftware.com'
AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM employee_recurring_holidays erh 
    WHERE erh.employee_id = profiles.id 
    AND erh.day_of_week = 0
);

-- Verify the insert
SELECT 'After Insert' as step, *
FROM employee_recurring_holidays 
WHERE employee_id = (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com');