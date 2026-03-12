-- LEAVE MANAGEMENT FIX - Make leave_type_id Optional
-- Run this in Supabase SQL Editor

-- Drop the foreign key constraint on leave_type_id
ALTER TABLE leave_requests 
DROP CONSTRAINT leave_requests_leave_type_id_fkey;

-- Make leave_type_id nullable
ALTER TABLE leave_requests 
ALTER COLUMN leave_type_id DROP NOT NULL;

-- Re-add the foreign key constraint as optional
ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_leave_type_id_fkey 
FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE SET NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests' AND column_name = 'leave_type_id';
