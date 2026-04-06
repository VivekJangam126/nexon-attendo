-- Immediately set all employees to Evening Shift
-- Run this to update everyone to evening shift right now

UPDATE profiles 
SET shift_type = 'evening'
WHERE role = 'employee';

-- Verify the update
SELECT 
  COUNT(*) as total_employees,
  COUNT(CASE WHEN shift_type = 'evening' THEN 1 END) as on_evening_shift,
  COUNT(CASE WHEN shift_type = 'morning' THEN 1 END) as on_morning_shift,
  COUNT(CASE WHEN shift_type IS NULL THEN 1 END) as no_shift_assigned
FROM profiles 
WHERE role = 'employee';

-- Show all employees with their shifts
SELECT full_name, email, shift_type
FROM profiles 
WHERE role = 'employee'
ORDER BY full_name;
