-- Test work application for March 14, 2026 (which shows as having 48 employees with holiday)
INSERT INTO employee_work_applications (
    employee_id,
    holiday_date,
    reason,
    status
) VALUES (
    (SELECT id FROM profiles WHERE full_name = 'Siddhesh Lalit Jadhav' LIMIT 1),
    '2026-03-14',
    'Need to complete urgent project work',
    'pending'
);

-- Check if the application was created
SELECT 
    ewa.*,
    p.full_name
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date = '2026-03-14';