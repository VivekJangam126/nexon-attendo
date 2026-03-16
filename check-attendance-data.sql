-- Check current users and their attendance records
SELECT 
    p.id,
    p.full_name,
    p.email,
    COUNT(a.id) as attendance_count
FROM profiles p
LEFT JOIN attendance a ON p.id = a.user_id
WHERE p.email IN ('vivekjangam@devconsoftware.com', 'siddheshjabhav7@devconsoftware.com')
GROUP BY p.id, p.full_name, p.email
ORDER BY p.full_name;

-- Check Vivek's attendance records
SELECT 
    a.*,
    p.full_name,
    p.email
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'vivekjangam@devconsoftware.com'
ORDER BY a.date DESC
LIMIT 20;

-- Check Siddhesh's attendance records  
SELECT 
    a.*,
    p.full_name,
    p.email
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
ORDER BY a.date DESC
LIMIT 20;