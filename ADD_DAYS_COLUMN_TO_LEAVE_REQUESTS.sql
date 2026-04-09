-- Add days column to leave_requests table to store calculated working days
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS days INTEGER;

-- Update existing records to calculate days as simple date difference
-- (This is a temporary calculation, new requests will use holiday-aware calculation)
UPDATE leave_requests 
SET days = (end_date - start_date) + 1
WHERE days IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN leave_requests.days IS 'Number of working days requested (excluding holidays)';
