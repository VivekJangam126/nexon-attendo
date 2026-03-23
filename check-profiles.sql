-- Check existing profiles
SELECT id, full_name, email FROM profiles LIMIT 10;

-- Check if work applications table exists
SELECT COUNT(*) FROM employee_work_applications;

-- Insert a test work application for March 14, 2026
INSERT INTO employee_work_applications (
    employee_id,
    holiday_date,
    reason,
    status
) 
SELECT 
    id,
    '2026-03-14',
    'Need to complete urgent project work',
    'pending'
FROM profiles 
WHERE full_name ILIKE '%admin%' OR full_name = 'Siddhesh Lalit Jadhav'
LIMIT 1
ON CONFLICT (employee_id, holiday_date) DO NOTHING;

-- Check the inserted application
SELECT 
    ewa.*,
    p.full_name
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date = '2026-03-14';