-- Debug Siddhesh's data to understand why frontend isn't showing it

-- 1. Get Siddhesh's user ID and profile info
SELECT 'Siddhesh Profile' as debug_step, 
       id, full_name, email, status, created_at
FROM profiles 
WHERE email = 'siddheshjabhav7@devconsoftware.com';

-- 2. Count all attendance records for Siddhesh
SELECT 'Total Attendance Count' as debug_step, 
       COUNT(*) as total_records
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';

-- 3. Show ALL attendance records for Siddhesh (not just recent)
SELECT 'All Siddhesh Records' as debug_step,
       a.id,
       a.date,
       a.check_in_time,
       a.check_out_time,
       a.status,
       a.created_at,
       a.updated_at
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
ORDER BY a.date DESC;

-- 4. Check if there are any records from the last 30 days
SELECT 'Last 30 Days Records' as debug_step,
       COUNT(*) as count_last_30_days
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
  AND a.date >= CURRENT_DATE - INTERVAL '30 days';

-- 5. Check if there are any records from the last 7 days
SELECT 'Last 7 Days Records' as debug_step,
       COUNT(*) as count_last_7_days
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
  AND a.date >= CURRENT_DATE - INTERVAL '7 days';

-- 6. Show the exact date format being used
SELECT 'Date Format Check' as debug_step,
       a.date,
       CURRENT_DATE as today,
       (a.date >= CURRENT_DATE - INTERVAL '7 days') as within_7_days,
       (a.date >= CURRENT_DATE - INTERVAL '30 days') as within_30_days
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
ORDER BY a.date DESC
LIMIT 5;