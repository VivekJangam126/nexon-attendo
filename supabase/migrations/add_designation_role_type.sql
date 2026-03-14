-- Migration: Add designation and role_type fields to profiles table
-- Date: 2026-03-13
-- Purpose: Support employee designation and role type tracking

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS role_type TEXT CHECK (role_type IN ('Employee', 'Intern', 'Unpaid Intern', 'Paid Intern'));

-- Update existing employees to have default values
UPDATE profiles 
SET designation = 'Not Assigned' 
WHERE designation IS NULL;

UPDATE profiles 
SET role_type = 'Employee' 
WHERE role_type IS NULL AND role = 'employee';

-- Add comment for documentation
COMMENT ON COLUMN profiles.designation IS 'Employee job designation (e.g., Software Developer, HR Executive)';
COMMENT ON COLUMN profiles.role_type IS 'Employee role type (Employee, Intern, Unpaid Intern, Paid Intern)';
