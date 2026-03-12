-- VERIFY LEAVE MANAGEMENT TABLES
-- Run this in Supabase SQL Editor to check if tables exist

-- Check if leave_requests table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'leave_requests'
) as leave_requests_exists;

-- Check if leave_types table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'leave_types'
) as leave_types_exists;

-- If tables exist, show their structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- Show all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
