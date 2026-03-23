-- Check all work applications
SELECT 
    ewa.*,
    p.full_name,
    p.email
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
ORDER BY ewa.holiday_date DESC;

-- Check work applications for April 2026
SELECT 
    ewa.*,
    p.full_name
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date >= '2026-04-01' 
AND ewa.holiday_date <= '2026-04-30'
ORDER BY ewa.holiday_date;

-- Check work applications for the dates you applied
SELECT 
    ewa.*,
    p.full_name
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE p.full_name ILIKE '%siddhesh%'
ORDER BY ewa.holiday_date;