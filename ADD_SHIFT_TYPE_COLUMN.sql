-- Add shift_type column to profiles table for Shift Management feature
-- Supports Morning (6:00 AM - 3:00 PM) and Evening (10:00 AM - 7:00 PM) shifts

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shift_type TEXT CHECK (shift_type IN ('morning', 'evening')) DEFAULT 'evening';

COMMENT ON COLUMN profiles.shift_type IS 'Employee shift type - morning (6AM-3PM) or evening (10AM-7PM)';

-- Update existing employees to have evening shift as default
UPDATE profiles 
SET shift_type = 'evening' 
WHERE shift_type IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'shift_type';
