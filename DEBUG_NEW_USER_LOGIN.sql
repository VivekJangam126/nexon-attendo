-- ================================================================
-- DEBUG NEW USER LOGIN ISSUE
-- ================================================================

-- Step 1: Find the new user in auth.users (Supabase auth system)
-- Note: You may need to check Supabase admin panel for this, but we can check profiles
SELECT 
  id,
  full_name,
  email,
  status,
  role,
  gender,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 3;

-- Step 2: Check if new user has all required fields
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.status,
  p.role,
  CASE WHEN p.designation IS NULL THEN '❌ MISSING' ELSE '✅ OK' END as designation_status,
  CASE WHEN p.office_id IS NULL THEN '❌ MISSING' ELSE '✅ OK' END as office_status,
  CASE WHEN p.gender IS NULL THEN '❌ MISSING' ELSE '✅ OK' END as gender_status
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 1;

-- Step 3: Check if user's leave balances were created
SELECT 
  COUNT(*) as balance_count,
  p.full_name,
  p.email
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
WHERE p.status = 'active'
GROUP BY p.full_name, p.email
ORDER BY p.created_at DESC;

-- Step 4: Find the newest active user
SELECT 
  id,
  full_name,
  email,
  status,
  role,
  created_at
FROM profiles
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 1;
