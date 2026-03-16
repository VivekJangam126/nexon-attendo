-- Verify what data actually exists for Siddhesh
-- Check if Siddhesh user exists and get his ID
SELECT 'Siddhesh User Info' as check_type, id, full_name, email, created_at
FROM profiles 
WHERE email = 'siddheshjabhav7@devconsoftware.com';

-- Check Siddhesh's attendance records
SELECT 'Siddhesh Attendance Records' as check_type, 
       COUNT(*) as total_records,
       MIN(date) as earliest_date,
       MAX(date) as latest_date
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';

-- Show all Siddhesh's attendance records
SELECT 'All Siddhesh Records' as check_type, 
       a.date, 
       a.check_in_time, 
       a.status,
       a.created_at
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
ORDER BY a.date DESC;

-- Check if Vivek exists and has data
SELECT 'Vivek User Info' as check_type, id, full_name, email
FROM profiles 
WHERE email = 'vivekjangam@devconsoftware.com';

-- Check Vivek's attendance count
SELECT 'Vivek Attendance Count' as check_type, COUNT(*) as total_records
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'vivekjangam@devconsoftware.com';

-- Show some of Vivek's records
SELECT 'Sample Vivek Records' as check_type, 
       a.date, 
       a.check_in_time, 
       a.status
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'vivekjangam@devconsoftware.com'
ORDER BY a.date DESC
LIMIT 5;