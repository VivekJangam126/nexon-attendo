-- ============================================
-- PHASE 2 SECURITY TESTING SCRIPT
-- Run these queries to verify implementation
-- ============================================

-- ============================================
-- TEST 1: VERIFY TABLES EXIST
-- ============================================
SELECT 'TEST 1: Checking tables...' as test;

SELECT table_name, 
       CASE 
         WHEN table_name IN ('attendance', 'rate_limits', 'audit_logs') THEN '✅ EXISTS'
         ELSE '❌ MISSING'
       END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('attendance', 'rate_limits', 'audit_logs')
ORDER BY table_name;

-- Expected: All 3 tables should show ✅ EXISTS

-- ============================================
-- TEST 2: VERIFY ATTENDANCE COLUMNS
-- ============================================
SELECT 'TEST 2: Checking attendance columns...' as test;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attendance'
  AND column_name IN ('device_id', 'user_agent', 'ip_address', 'request_id')
ORDER BY column_name;

-- Expected: 4 rows showing all new columns

-- ============================================
-- TEST 3: VERIFY UNIQUE CONSTRAINT
-- ============================================
SELECT 'TEST 3: Checking UNIQUE constraint...' as test;

SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'attendance'
  AND constraint_name = 'unique_user_date';

-- Expected: 1 row showing UNIQUE constraint

-- ============================================
-- TEST 4: VERIFY INDEXES
-- ============================================
SELECT 'TEST 4: Checking indexes...' as test;

SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_attendance_user_date',
    'idx_attendance_device',
    'idx_attendance_request',
    'idx_rate_limits_lookup',
    'idx_rate_limits_cleanup',
    'idx_audit_admin',
    'idx_audit_target',
    'idx_audit_created',
    'idx_audit_action'
  )
ORDER BY tablename, indexname;

-- Expected: 9 rows showing all indexes

-- ============================================
-- TEST 5: VERIFY RATE LIMIT FUNCTION
-- ============================================
SELECT 'TEST 5: Testing rate limit function...' as test;

-- Test 1: First request (should allow)
SELECT * FROM check_rate_limit('test-user-1', 'test-endpoint', 5, 10);
-- Expected: allowed=true, remaining=4

-- Test 2: Second request (should allow)
SELECT * FROM check_rate_limit('test-user-1', 'test-endpoint', 5, 10);
-- Expected: allowed=true, remaining=3

-- Test 3: Third request (should allow)
SELECT * FROM check_rate_limit('test-user-1', 'test-endpoint', 5, 10);
-- Expected: allowed=true, remaining=2

-- Test 4: Fourth request (should allow)
SELECT * FROM check_rate_limit('test-user-1', 'test-endpoint', 5, 10);
-- Expected: allowed=true, remaining=1

-- Test 5: Fifth request (should allow)
SELECT * FROM check_rate_limit('test-user-1', 'test-endpoint', 5, 10);
-- Expected: allowed=true, remaining=0

-- Test 6: Sixth request (should block)
SELECT * FROM check_rate_limit('test-user-1', 'test-endpoint', 5, 10);
-- Expected: allowed=false, remaining=0

-- ============================================
-- TEST 6: VERIFY RATE LIMITS TABLE
-- ============================================
SELECT 'TEST 6: Checking rate_limits table...' as test;

SELECT identifier, endpoint, request_count, window_start
FROM rate_limits
WHERE identifier = 'test-user-1'
ORDER BY window_start DESC
LIMIT 1;

-- Expected: 1 row showing request_count=5 (or 6 if test ran twice)

-- ============================================
-- TEST 7: TEST AUDIT LOGS TABLE
-- ============================================
SELECT 'TEST 7: Testing audit_logs table...' as test;

-- Insert test audit log (replace <admin-uuid> with actual admin ID)
-- INSERT INTO audit_logs (admin_id, action_type, target_type, ip_address)
-- VALUES ('<admin-uuid>', 'test_action', 'test_target', '127.0.0.1');

-- Query audit logs
SELECT id, action_type, target_type, ip_address, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Shows recent audit log entries (if any)

-- ============================================
-- TEST 8: TEST DUPLICATE PREVENTION
-- ============================================
SELECT 'TEST 8: Testing duplicate prevention...' as test;

-- This test requires an actual user_id from your system
-- Replace <user-uuid> with a real user ID

-- Attempt 1: Should succeed
-- INSERT INTO attendance (user_id, date, check_in_time, status, office_id)
-- VALUES ('<user-uuid>', CURRENT_DATE, NOW(), 'present', '<office-uuid>');

-- Attempt 2: Should fail with unique violation
-- INSERT INTO attendance (user_id, date, check_in_time, status, office_id)
-- VALUES ('<user-uuid>', CURRENT_DATE, NOW(), 'present', '<office-uuid>');

-- Expected: Second insert fails with error 23505

-- ============================================
-- TEST 9: CHECK TABLE SIZES
-- ============================================
SELECT 'TEST 9: Checking table sizes...' as test;

SELECT 
  'attendance' as table_name,
  COUNT(*) as row_count
FROM attendance
UNION ALL
SELECT 
  'rate_limits' as table_name,
  COUNT(*) as row_count
FROM rate_limits
UNION ALL
SELECT 
  'audit_logs' as table_name,
  COUNT(*) as row_count
FROM audit_logs;

-- Expected: Shows current row counts for all tables

-- ============================================
-- TEST 10: VERIFY RLS POLICIES
-- ============================================
SELECT 'TEST 10: Checking RLS policies...' as test;

SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('attendance', 'rate_limits', 'audit_logs')
ORDER BY tablename, policyname;

-- Expected: Shows RLS policies for tables

-- ============================================
-- CLEANUP TEST DATA
-- ============================================
SELECT 'CLEANUP: Removing test data...' as test;

-- Remove test rate limit records
DELETE FROM rate_limits 
WHERE identifier LIKE 'test-user-%';

-- Remove test audit logs (if any)
-- DELETE FROM audit_logs 
-- WHERE action_type = 'test_action';

SELECT 'Cleanup complete' as status;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 'TESTING COMPLETE' as status;

-- Review results above:
-- ✅ All tables exist
-- ✅ All columns added
-- ✅ UNIQUE constraint exists
-- ✅ All indexes created
-- ✅ Rate limit function works
-- ✅ Rate limits enforced correctly
-- ✅ Audit logs table functional
-- ✅ Duplicate prevention working

-- If all tests pass, Phase 2 database layer is ready!

