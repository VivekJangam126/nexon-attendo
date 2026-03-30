-- Debug why leave requests are not showing in UI
-- This will help identify the mismatch between database and API

-- 1. Check all leave requests in database
SELECT 
    lr.id,
    lr.employee_id,
    p.full_name,
    p.email,
    lr.start_date,
    lr.end_date,
    lr.status,
    lr.attachment_url,
    lr.created_at
FROM leave_requests lr
LEFT JOIN profiles p ON lr.employee_id = p.id
ORDER BY lr.created_at DESC
LIMIT 10;

-- 2. Check if employee_id matches between leave_requests and profiles
SELECT 
    'Leave Requests' as source,
    COUNT(*) as count,
    array_agg(DISTINCT employee_id) as employee_ids
FROM leave_requests
UNION ALL
SELECT 
    'Profiles' as source,
    COUNT(*) as count,
    array_agg(DISTINCT id) as employee_ids
FROM profiles;

-- 3. Find leave requests with no matching profile
SELECT 
    lr.id,
    lr.employee_id,
    lr.start_date,
    lr.status,
    CASE 
        WHEN p.id IS NULL THEN '❌ No matching profile'
        ELSE '✓ Profile exists'
    END as profile_status
FROM leave_requests lr
LEFT JOIN profiles p ON lr.employee_id = p.id
ORDER BY lr.created_at DESC;

-- 4. Check the specific employee who should see leave requests
-- Replace with the actual employee email
SELECT 
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    COUNT(lr.id) as leave_request_count
FROM profiles p
LEFT JOIN leave_requests lr ON p.id = lr.employee_id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'  -- Replace with actual email
GROUP BY p.id, p.email, p.full_name, p.role;
