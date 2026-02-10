-- ============================================
-- CREATE ADMIN PROFILE
-- Run this AFTER creating the auth user in Supabase Dashboard
-- ============================================

-- Step 1: Check if admin auth user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@nexon.com';

-- Step 2: Create profile for the admin user (if exists)
-- This will automatically use the user ID from auth.users
INSERT INTO profiles (id, email, full_name, role, status, office_location)
SELECT 
  id,
  email,
  'Admin User',
  'admin',
  'active',
  (SELECT id FROM offices WHERE name LIKE '%Bangalore%' LIMIT 1)
FROM auth.users 
WHERE email = 'admin@nexon.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  full_name = 'Admin User';

-- Step 3: Verify the profile was created
SELECT id, email, full_name, role, status, office_location
FROM profiles 
WHERE email = 'admin@nexon.com';

-- ============================================
-- RESULT: You should see the admin profile with role='admin' and status='active'
-- ============================================
