-- Check the actual structure of the attendance table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample record to see what columns actually exist
SELECT *
FROM attendance
LIMIT 1;