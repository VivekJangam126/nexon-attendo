-- Add attachment_url column to leave_requests table
-- This will store the Cloudinary URL of uploaded documents/images

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN leave_requests.attachment_url IS 'Optional Cloudinary URL for supporting documents (medical certificates, etc.)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
AND column_name = 'attachment_url';
