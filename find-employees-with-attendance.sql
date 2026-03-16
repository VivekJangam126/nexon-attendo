-- Find employees who actually have attendance records
SELECT 
    p.full_name,
    p.email,
    COUNT(a.id) as attendance_count,
    MIN(a.date) as earliest_date,
    MAX(a.date) as latest_date
FROM profiles p
LEFT JOIN attendance a ON p.id = a.user_id
WHERE p.status = 'active'
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(a.id) > 1  -- Only show employees with more than 1 attendance record
ORDER BY attendance_count DESC;

-- Show sample attendance records from employees with data
SELECT 
    p.full_name,
    p.email,
    a.date,
    a.check_in_time,
    a.status
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.status = 'active'
ORDER BY p.full_name, a.date DESC
LIMIT 20;