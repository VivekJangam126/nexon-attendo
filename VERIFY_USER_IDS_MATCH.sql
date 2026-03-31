-- Verify that employee_id in leave_requests matches the actual user IDs in profiles

-- Check 1: See all leave requests with their employee info
SELECT 
    lr.id as request_id,
    lr.employee_id as leave_request_employee_id,
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    lr.start_date,
    lr.end_date,
    lr.status,
    CASE 
        WHEN lr.employee_id = p.id THEN '✓ Match'
        ELSE '✗ MISMATCH - THIS IS THE PROBLEM'
    END as id_status
FROM leave_requests lr
LEFT JOIN profiles p ON lr.employee_id = p.id
ORDER BY lr.created_at DESC;

-- Check 2: Find any orphaned leave requests (no matching profile)
SELECT 
    lr.id,
    lr.employee_id,
    lr.start_date,
    lr.status,
    'No matching profile found' as issue
FROM leave_requests lr
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = lr.employee_id
);

-- Check 3: Show all profiles to see available user IDs
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- If there are mismatches, you may need to update the employee_id in leave_requests
-- to match the correct profile.id
