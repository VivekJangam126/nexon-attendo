-- Test RLS policies with actual user IDs from your system
-- This simulates what happens when a user tries to fetch leave requests

-- Test 1: Simulate employee "Siddhesh Lalit Jadhav" viewing their own requests
-- Their ID: 86a6b1de-390c-4cf3-8968-465e4260ddce
-- They should see their own request (b3794d76-58fa-490f-b9cc-6984c52a9272)

-- First, let's verify the RLS policies are active
SELECT 
    tablename,
    policyname,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'leave_requests'
ORDER BY policyname;

-- Test 2: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'leave_requests';

-- Test 3: Try to select as if we're the employee
-- This uses a direct query (not through RLS) to see what SHOULD be visible
SELECT 
    lr.id,
    lr.employee_id,
    lr.start_date,
    lr.end_date,
    lr.status,
    p.full_name,
    p.email,
    'Should be visible to employee' as visibility
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
WHERE lr.employee_id = '86a6b1de-390c-4cf3-8968-465e4260ddce';

-- Test 4: Check admin user
SELECT 
    id,
    email,
    full_name,
    role,
    'Should see ALL requests' as admin_access
FROM profiles
WHERE role = 'admin';

-- Test 5: Verify the RLS policy logic manually
-- This checks if the policy conditions would evaluate to true
SELECT 
    lr.id as request_id,
    lr.employee_id,
    p.full_name as employee_name,
    p.role as employee_role,
    -- Check if employee can see their own
    CASE 
        WHEN lr.employee_id = '86a6b1de-390c-4cf3-8968-465e4260ddce' 
        THEN '✓ Employee can see (own request)'
        ELSE '✗ Employee cannot see'
    END as employee_access,
    -- Check if admin can see
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = '6b13ebf6-e5ea-4bfc-8775-4fb77e591f1d' 
            AND role = 'admin'
        )
        THEN '✓ Admin can see (all requests)'
        ELSE '✗ Admin cannot see'
    END as admin_access
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id;

-- IMPORTANT: If all these tests pass but the deployed app still doesn't show requests,
-- the issue is likely:
-- 1. The auth session is not being passed correctly to the API
-- 2. The API is using supabaseAdmin but not returning data properly
-- 3. There's a CORS or network issue preventing the API response
