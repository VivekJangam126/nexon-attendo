-- ============================================
-- RE-ENABLE RLS FOR NOTIFICATION TABLES
-- ============================================
-- Run this after testing is complete to restore security

-- Re-enable RLS on notification tables
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notification_settings', 'notification_contacts', 'notification_history');

-- ✅ If rls_enabled = true for all tables, RLS is re-enabled and secure
