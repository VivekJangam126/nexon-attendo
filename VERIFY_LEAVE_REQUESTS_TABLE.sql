-- Verify leave_requests table structure
-- Check if all required columns exist

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- 2. Check if attachment_url column exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leave_requests' 
    AND column_name = 'attachment_url'
) as attachment_url_exists;

-- 3. Try to insert a test record (will show what's missing)
-- Uncomment to test:
-- INSERT INTO leave_requests (
--     employee_id,
--     leave_type_id,
--     start_date,
--     end_date,
--     reason,
--     status,
--     attachment_url
-- ) VALUES (
--     'test-employee-id',
--     '11111111-1111-1111-1111-111111111111',
--     '2026-04-01',
--     '2026-04-02',
--     'Test reason',
--     'pending',
--     'https://test.com/file.pdf'
-- );

-- 4. Check recent leave requests
SELECT 
    id,
    employee_id,
    leave_type_id,
    start_date,
    end_date,
    reason,
    status,
    attachment_url,
    created_at
FROM leave_requests
ORDER BY created_at DESC
LIMIT 5;
