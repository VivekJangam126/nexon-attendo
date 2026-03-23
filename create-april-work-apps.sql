-- Create work applications for April 2026 holidays
-- First, let's see what holidays exist in April 2026
SELECT 
    holiday_date,
    reason,
    COUNT(*) as employee_count
FROM employee_specific_holidays 
WHERE holiday_date >= '2026-04-01' 
AND holiday_date <= '2026-04-30'
GROUP BY holiday_date, reason
ORDER BY holiday_date;

-- Create work applications for some April dates
INSERT INTO employee_work_applications (
    employee_id,
    holiday_date,
    reason,
    status
) 
SELECT 
    p.id,
    '2026-04-14',  -- April 14th
    'Need to complete urgent project work',
    'pending'
FROM profiles p 
WHERE p.full_name = 'Siddhesh Lalit Jadhav'
ON CONFLICT (employee_id, holiday_date) DO NOTHING;

-- Create another one for April 25th
INSERT INTO employee_work_applications (
    employee_id,
    holiday_date,
    reason,
    status
) 
SELECT 
    p.id,
    '2026-04-25',  -- April 25th
    'Important client meeting',
    'pending'
FROM profiles p 
WHERE p.full_name = 'Siddhesh Lalit Jadhav'
ON CONFLICT (employee_id, holiday_date) DO NOTHING;

-- Check what we created
SELECT 
    ewa.*,
    p.full_name
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date >= '2026-04-01' 
AND ewa.holiday_date <= '2026-04-30'
ORDER BY ewa.holiday_date;