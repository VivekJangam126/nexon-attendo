-- ============================================
-- PHASE 2: SECURITY HARDENING
-- Migration Script for Enhanced Security
-- ============================================
-- 
-- This migration adds:
-- 1. Duplicate prevention (UNIQUE constraint)
-- 2. Request tracking (device_id, user_agent, ip_address, request_id)
-- 3. Rate limiting infrastructure
-- 4. Audit logging for admin actions
-- 5. Atomic rate limit checking function
--
-- IMPORTANT: Run Step 0 (duplicate check) before executing this migration
-- ============================================

-- ============================================
-- STEP 0: PRE-MIGRATION DUPLICATE CHECK
-- ============================================
-- Run this query FIRST to check for existing duplicates:
-- 
-- SELECT user_id, date, COUNT(*) as duplicate_count
-- FROM attendance 
-- GROUP BY user_id, date 
-- HAVING COUNT(*) > 1;
--
-- If this returns any rows, clean duplicates before proceeding:
-- 
-- DELETE FROM attendance a
-- USING (
--   SELECT user_id, date, MIN(check_in_time) as earliest_checkin
--   FROM attendance
--   GROUP BY user_id, date
--   HAVING COUNT(*) > 1
-- ) b
-- WHERE a.user_id = b.user_id 
--   AND a.date = b.date 
--   AND a.check_in_time > b.earliest_checkin;
--
-- ============================================

-- ============================================
-- PART A: ATTENDANCE TABLE ENHANCEMENTS
-- ============================================

-- Add tracking columns for security and debugging
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS request_id UUID DEFAULT gen_random_uuid();

-- Add UNIQUE constraint to prevent duplicate attendance
-- This is the PRIMARY defense against duplicate check-ins
ALTER TABLE attendance 
ADD CONSTRAINT unique_user_date UNIQUE(user_id, date);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_device ON attendance(device_id);
CREATE INDEX IF NOT EXISTS idx_attendance_request ON attendance(request_id);
CREATE INDEX IF NOT EXISTS idx_attendance_ip ON attendance(ip_address);

-- Note: idx_attendance_user_date already exists from COMPLETE_DATABASE_SETUP.sql

-- ============================================
-- PART B: RATE LIMITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON rate_limits(identifier, endpoint, window_start);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
ON rate_limits(window_start);

-- ============================================
-- PART C: AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type <> ''),
  target_type TEXT NOT NULL CHECK (target_type <> ''),
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);

-- Enable RLS on audit_logs (admin-only access)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs (via service role key)
-- No INSERT/UPDATE policies needed - service role handles this

-- ============================================
-- PART D: ATOMIC RATE LIMITING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_record_id UUID;
  v_record_window_start TIMESTAMPTZ;
BEGIN
  -- Probabilistic cleanup (1% chance) - prevents table growth
  IF random() < 0.01 THEN
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '24 hours';
  END IF;

  -- Calculate window start time
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create rate limit record (atomic with row lock)
  SELECT id, request_count, window_start 
  INTO v_record_id, v_current_count, v_record_window_start
  FROM rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start > v_window_start
  ORDER BY window_start DESC
  LIMIT 1
  FOR UPDATE; -- CRITICAL: Locks row to prevent race conditions
  
  -- If no recent record or window expired, create new window
  IF v_record_id IS NULL THEN
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, NOW())
    RETURNING id, window_start INTO v_record_id, v_record_window_start;
    
    RETURN QUERY SELECT 
      true::BOOLEAN, 
      (p_limit - 1)::INTEGER, 
      (v_record_window_start + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Check if limit exceeded
  IF v_current_count >= p_limit THEN
    RETURN QUERY SELECT 
      false::BOOLEAN, 
      0::INTEGER, 
      (v_record_window_start + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Increment count atomically
  UPDATE rate_limits
  SET request_count = request_count + 1,
      created_at = NOW()
  WHERE id = v_record_id;
  
  RETURN QUERY SELECT 
    true::BOOLEAN, 
    (p_limit - (v_current_count + 1))::INTEGER, 
    (v_record_window_start + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify setup:

-- Check attendance table columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'attendance'
-- AND column_name IN ('device_id', 'user_agent', 'ip_address', 'request_id')
-- ORDER BY column_name;

-- Check UNIQUE constraint exists
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'attendance'
-- AND constraint_name = 'unique_user_date';

-- Check rate_limits table created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'rate_limits';

-- Check audit_logs table created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'audit_logs';

-- Test rate limit function
-- SELECT * FROM check_rate_limit('test-user', 'test-endpoint', 5, 10);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Next Steps:
-- 1. Verify all tables and indexes created successfully
-- 2. Test rate limit function with sample calls
-- 3. Proceed to Layer 2: Service Layer implementation
-- 4. Deploy backend services with rate limiting
-- 5. Monitor rate_limits table size (should stay under 10,000 rows)

