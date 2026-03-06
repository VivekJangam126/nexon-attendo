-- Add phone column to profiles table
-- This script adds a phone number field for employee profiles

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        COMMENT ON COLUMN profiles.phone IS 'Employee phone number';
    END IF;
END $$;

-- Add password_reset_required column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'password_reset_required'
    ) THEN
        ALTER TABLE profiles ADD COLUMN password_reset_required BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN profiles.password_reset_required IS 'Flag to force password change on next login';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('phone', 'password_reset_required')
ORDER BY column_name;