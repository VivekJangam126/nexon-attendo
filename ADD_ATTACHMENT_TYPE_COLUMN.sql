-- Add attachment_type column to leave_requests table
-- This stores the file type ('image' or 'pdf') for reliable display handling

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

-- Add comment to explain the column
COMMENT ON COLUMN leave_requests.attachment_type IS 'File type of attachment: image or pdf. Used to determine display rendering.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
AND column_name = 'attachment_type';
