-- LEAVE SUBMISSION FIX - Remove leave_type_id Requirement
-- Run this in Supabase SQL Editor to fix "Failed to submit leave request" error

-- Step 1: Drop existing foreign key constraint
ALTER TABLE leave_requests 
DROP CONSTRAINT leave_requests_leave_type_id_fkey;

-- Step 2: Make leave_type_id nullable
ALTER TABLE leave_requests 
ALTER COLUMN leave_type_id DROP NOT NULL;

-- Step 3: Add back the foreign key as optional (ON DELETE SET NULL)
ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_leave_type_id_fkey 
FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE SET NULL;

-- Step 4: Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests' AND column_name = 'leave_type_id';

-- Done! Now employees can submit leave requests without a leave_type_id
