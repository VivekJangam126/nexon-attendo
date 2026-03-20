-- Try different role values to see what's allowed by the constraint

-- First check what values currently exist
SELECT DISTINCT role_type, COUNT(*) 
FROM profiles 
GROUP BY role_type;

-- Try to find what role values are valid by checking existing data or constraint
-- Let's try common role value patterns:

-- Option 1: Try 'admin' (lowercase)
-- UPDATE profiles SET role_type = 'admin' WHERE full_name ILIKE '%siddhesh%' LIMIT 1;

-- Option 2: Try 'super_admin' 
-- UPDATE profiles SET role_type = 'super_admin' WHERE full_name ILIKE '%siddhesh%' LIMIT 1;

-- Option 3: Try 'administrator'
-- UPDATE profiles SET role_type = 'administrator' WHERE full_name ILIKE '%siddhesh%' LIMIT 1;

-- Option 4: Try 'manager'
-- UPDATE profiles SET role_type = 'manager' WHERE full_name ILIKE '%siddhesh%' LIMIT 1;

-- Let's start with the safest approach - just set everyone to 'employee' first
UPDATE profiles 
SET role_type = 'employee'
WHERE role_type IS NULL 
  AND status = 'active';

-- Check if that worked
SELECT role_type, COUNT(*) 
FROM profiles 
GROUP BY role_type;