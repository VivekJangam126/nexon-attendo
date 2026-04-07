-- Diagnostic Script for Leave Requests Endpoint Issues

-- Step 1: Check table structure via information_schema
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- Step 2: Check for necessary columns (duplicate of step 1 for clarity)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- Step 3: Check data exists
SELECT COUNT(*) as total_records FROM leave_requests;
SELECT COUNT(*) as approved_today 
FROM leave_requests 
WHERE status = 'approved' 
  AND start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE;

-- Step 4: Check for profile access
SELECT 
    lr.id,
    lr.employee_id,
    p.full_name,
    lr.status,
    lr.start_date,
    lr.end_date
FROM leave_requests lr
LEFT JOIN profiles p ON lr.employee_id = p.id
WHERE lr.status = 'approved'
  AND lr.start_date <= CURRENT_DATE
  AND lr.end_date >= CURRENT_DATE
LIMIT 5;

-- Step 5: Check RLS status and policies
SELECT 
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE tablename IN ('leave_requests', 'profiles')
  AND schemaname = 'public';

-- Step 6: Show all policies on leave_requests
SELECT 
    policyname,
    permissive,
    roles,
    qual as "using_condition",
    with_check
FROM pg_policies
WHERE tablename = 'leave_requests'
ORDER BY policyname;

-- Step 7: Check if profiles table has RLS issues
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 8: Check if there are any FK constraint issues
SELECT 
    kcu.constraint_name,
    tc.constraint_type,
    kcu.table_name,
    kcu.column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE kcu.table_name IN ('leave_requests', 'profiles')
ORDER BY kcu.table_name, kcu.constraint_name;
