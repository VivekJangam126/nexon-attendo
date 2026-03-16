-- Check Siddhesh's holiday configuration
-- Get Siddhesh's user ID
SELECT 'Siddhesh User ID' as check_type, id, full_name, email
FROM profiles 
WHERE email = 'siddheshjabhav7@devconsoftware.com';

-- Check if Siddhesh has any recurring holidays (like Sunday = day 0)
SELECT 'Recurring Holidays' as check_type, *
FROM employee_recurring_holidays 
WHERE employee_id = (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com');

-- Check if Siddhesh has any specific holidays
SELECT 'Specific Holidays' as check_type, *
FROM employee_specific_holidays 
WHERE employee_id = (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com');

-- Check what day of week Sunday is (should be 0)
SELECT 'Sunday Check' as check_type, 
       EXTRACT(DOW FROM DATE '2026-03-15') as sunday_dow,  -- March 15, 2026 is a Sunday
       EXTRACT(DOW FROM DATE '2026-03-08') as another_sunday_dow;