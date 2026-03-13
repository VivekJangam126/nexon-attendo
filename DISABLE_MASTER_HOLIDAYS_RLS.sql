-- Temporarily disable RLS on master_public_holidays to allow holiday sync
-- Run this in your Supabase SQL Editor

-- Disable RLS
ALTER TABLE master_public_holidays DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'master_public_holidays';
