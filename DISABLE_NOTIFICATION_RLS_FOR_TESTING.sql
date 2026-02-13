-- ============================================
-- DISABLE RLS FOR NOTIFICATION TABLES (TESTING ONLY)
-- ============================================
-- ⚠️ WARNING: This removes security policies for testing
-- ⚠️ Re-enable RLS after testing is complete!

-- Disable RLS on notification tables
ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notification_settings', 'notification_contacts', 'notification_history');

-- ✅ If rls_enabled = false for all tables, RLS is disabled

-- ============================================
-- TO RE-ENABLE RLS AFTER TESTING:
-- ============================================
-- Run this when you're done testing:
--
-- ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
