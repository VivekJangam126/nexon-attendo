-- Add is_backdated column to leave_requests table
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS is_backdated BOOLEAN DEFAULT false;

-- Create index for filtering backdated requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_backdated ON leave_requests(is_backdated)
WHERE is_backdated = true;

-- Add comment for documentation
COMMENT ON COLUMN leave_requests.is_backdated IS 'Flag indicating if leave was applied for a past date (backdated)';
