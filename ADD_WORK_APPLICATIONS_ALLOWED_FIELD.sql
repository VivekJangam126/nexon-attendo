-- Add work_applications_allowed field to both holiday tables

-- Add to employee_specific_holidays table
ALTER TABLE employee_specific_holidays 
ADD COLUMN work_applications_allowed BOOLEAN DEFAULT false;

-- Add to employee_recurring_holidays table  
ALTER TABLE employee_recurring_holidays 
ADD COLUMN work_applications_allowed BOOLEAN DEFAULT false;

-- Add comments to explain the field
COMMENT ON COLUMN employee_specific_holidays.work_applications_allowed IS 'Whether employees can apply to work on this holiday';
COMMENT ON COLUMN employee_recurring_holidays.work_applications_allowed IS 'Whether employees can apply to work on this recurring holiday';

-- Update existing holidays to allow work applications (optional - you can set this to false if you want to start fresh)
UPDATE employee_specific_holidays SET work_applications_allowed = true;
UPDATE employee_recurring_holidays SET work_applications_allowed = true;