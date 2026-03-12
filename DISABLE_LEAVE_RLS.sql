-- Disable RLS on leave_requests table to allow fetching
-- This is a temporary solution - in production, you should use proper RLS policies

ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'leave_requests';
