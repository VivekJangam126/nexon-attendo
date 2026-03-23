-- Check if work applications exist
SELECT COUNT(*) as total_applications FROM employee_work_applications;

-- Check work applications for April 2026
SELECT 
    ewa.*,
    p.full_name,
    p.email
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date >= '2026-04-01' 
AND ewa.holiday_date <= '2026-04-30'
ORDER BY ewa.holiday_date;

-- Check current user's profile (to see if RLS is working)
SELECT 
    id, 
    full_name, 
    email,
    CASE 
        WHEN full_name ILIKE '%admin%' THEN 'Admin by name'
        WHEN full_name = 'Siddhesh Lalit Jadhav' THEN 'Admin by specific name'
        WHEN email ILIKE '%admin%' THEN 'Admin by email'
        ELSE 'Not admin'
    END as admin_status
FROM profiles 
WHERE id = auth.uid();

-- Test RLS policy directly
SELECT 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (
            full_name ILIKE '%admin%' 
            OR full_name = 'Siddhesh Lalit Jadhav'
            OR email ILIKE '%admin%'
        )
    ) as can_see_work_applications;