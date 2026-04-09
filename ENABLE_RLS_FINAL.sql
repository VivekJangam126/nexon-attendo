-- ============================================
-- TARGETED RLS ENABLEMENT SCRIPT
-- Only enabling 13 tables that currently have RLS disabled
-- ============================================

-- ============================================
-- STEP 1: Enable RLS on the 13 disabled tables
-- ============================================

-- These 13 tables have policies but RLS is disabled
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_specific_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_recurring_holidays ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Verify all tables now have RLS enabled
-- ============================================
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'offices', 'leave_types', 'rate_limits', 'leave_requests', 'employee_leave_balance',
    'notification_history', 'notification_settings', 'notification_contacts', 'attendance',
    'profiles', 'master_public_holidays', 'employee_specific_holidays', 'employee_recurring_holidays',
    'office_networks', 'break_logs', 'employee_requests', 'performance_metrics', 'performance_alerts',
    'alert_thresholds', 'leave_policies', 'audit_logs', 'email_report_settings', 'email_report_logs',
    'attendance_settings', 'face_encodings', 'face_verification_logs', 'employee_work_applications',
    'custom_roles', 'custom_designations'
)
ORDER BY tablename;

-- ============================================
-- STEP 3: Show all RLS policies for reference
-- ============================================
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
