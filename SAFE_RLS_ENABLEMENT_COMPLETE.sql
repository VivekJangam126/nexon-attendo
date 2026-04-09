-- ============================================
-- SAFE RLS ENABLEMENT SCRIPT
-- All policies already exist - we just enable RLS
-- ============================================

-- STEP 1: Check current RLS status (for reference)
-- Run this BEFORE enabling to see what's currently disabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- (All policies are already in place)
-- ============================================

-- Core tables with comprehensive policies
ALTER TABLE IF EXISTS alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS break_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_report_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_work_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS face_encodings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS face_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS master_public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS office_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: VERIFY RLS IS ENABLED
-- ============================================
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'alert_thresholds', 'attendance', 'attendance_settings', 'break_logs',
    'custom_designations', 'custom_roles', 'email_report_logs', 'email_report_settings',
    'employee_leave_balance', 'employee_requests', 'employee_work_applications',
    'face_encodings', 'face_verification_logs', 'leave_policies', 'leave_requests',
    'leave_types', 'master_public_holidays', 'notification_contacts', 'notification_history',
    'notification_settings', 'office_networks', 'offices', 'performance_alerts',
    'performance_metrics', 'profiles'
)
ORDER BY tablename;

-- ============================================
-- STEP 4: View all policies to confirm they exist
-- ============================================
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
