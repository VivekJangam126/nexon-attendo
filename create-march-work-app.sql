-- Create work applications for March 2026 to test the UI
-- First, let's see what holidays exist in March 2026
SELECT 
    holiday_date,
    reason,
    COUNT(*) as employee_count
FROM employee_specific_holidays 
WHERE holiday_date >= '2026-03-01' 
AND holiday_date <= '2026-03-31'
GROUP BY holiday_date, reason
ORDER BY holiday_date;

-- Create work applications for March 23rd (which shows as "Today" in the screenshot)
INSERT INTO employee_work_applications (
    employee_id,
    holiday_date,
    reason,
    status
) 
SELECT 
    p.id,
    '2026-03-23',  -- March 23rd (Today)
    'Need to attend important client meeting',
    'pending'
FROM profiles p 
WHERE p.full_name = 'Siddhesh Lalit Jadhav'
ON CONFLICT (employee_id, holiday_date) DO NOTHING;

-- Create another one for March 14th and approve it to test both statuses
INSERT INTO employee_work_applications (
    employee_id,
    holiday_date,
    reason,
    status
) 
SELECT 
    p.id,
    '2026-03-14',  -- March 14th
    'Project deadline requires my presence',
    'approved'
FROM profiles p 
WHERE p.full_name = 'Siddhesh Lalit Jadhav'
ON CONFLICT (employee_id, holiday_date) DO NOTHING;

-- Check what we created for March
SELECT 
    ewa.*,
    p.full_name
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date >= '2026-03-01' 
AND ewa.holiday_date <= '2026-03-31'
ORDER BY ewa.holiday_date;