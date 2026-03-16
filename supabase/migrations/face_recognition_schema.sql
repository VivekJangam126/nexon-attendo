-- Face Recognition Schema Migration
-- Creates tables for storing face encodings and verification logs

-- Table: face_encodings
-- Stores mathematical face encodings (not raw biometric data)
CREATE TABLE IF NOT EXISTS face_encodings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encoding JSONB NOT NULL,  -- Face encoding as JSON array
  confidence_threshold DECIMAL(5,2) DEFAULT 80.00 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id)  -- One encoding per employee
);

-- Table: face_verification_logs
-- Logs all face verification attempts for audit trail
CREATE TABLE IF NOT EXISTS face_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('success', 'failed', 'no_face', 'error')),
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to profiles table for photo storage
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS face_registered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_registered_at TIMESTAMP WITH TIME ZONE;

-- Add columns to attendance table for face verification
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_confidence DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_face_encodings_employee ON face_encodings(employee_id);
CREATE INDEX IF NOT EXISTS idx_face_verification_logs_employee ON face_verification_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_face_verification_logs_attendance ON face_verification_logs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_face_verification_logs_status ON face_verification_logs(verification_status);
CREATE INDEX IF NOT EXISTS idx_face_verification_logs_created ON face_verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_face_registered ON profiles(face_registered);

-- Create updated_at trigger for face_encodings
CREATE OR REPLACE FUNCTION update_face_encodings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_face_encodings_updated_at ON face_encodings;
CREATE TRIGGER trigger_update_face_encodings_updated_at
BEFORE UPDATE ON face_encodings
FOR EACH ROW
EXECUTE FUNCTION update_face_encodings_updated_at();

-- Create function to update profile when face is registered
CREATE OR REPLACE FUNCTION update_profile_face_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET face_registered = TRUE,
      face_registered_at = NOW()
  WHERE id = NEW.employee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_face_status ON face_encodings;
CREATE TRIGGER trigger_update_profile_face_status
AFTER INSERT OR UPDATE ON face_encodings
FOR EACH ROW
EXECUTE FUNCTION update_profile_face_status();

-- Create function to clean up old verification logs (optional - keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_verification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM face_verification_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE face_encodings IS 'Stores mathematical face encodings for employee verification';
COMMENT ON TABLE face_verification_logs IS 'Audit trail of all face verification attempts';
COMMENT ON COLUMN face_encodings.encoding IS 'Face encoding as JSON array (128-dimensional vector)';
COMMENT ON COLUMN face_encodings.confidence_threshold IS 'Minimum confidence percentage required for verification';
COMMENT ON COLUMN face_verification_logs.verification_status IS 'Status: success, failed, no_face, error';
COMMENT ON COLUMN face_verification_logs.processing_time_ms IS 'Time taken to process verification in milliseconds';

-- Grant permissions (adjust based on your RLS policies)
-- These are examples - modify based on your security requirements

-- Allow employees to read their own face encoding status
ALTER TABLE face_encodings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view their own face encoding status" ON face_encodings;
CREATE POLICY "Employees can view their own face encoding status"
ON face_encodings FOR SELECT
USING (auth.uid() = employee_id);

-- Allow service role to manage face encodings
DROP POLICY IF EXISTS "Service role can manage face encodings" ON face_encodings;
CREATE POLICY "Service role can manage face encodings"
ON face_encodings FOR ALL
USING (auth.role() = 'service_role');

-- Allow employees to view their own verification logs
ALTER TABLE face_verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view their own verification logs" ON face_verification_logs;
CREATE POLICY "Employees can view their own verification logs"
ON face_verification_logs FOR SELECT
USING (auth.uid() = employee_id);

-- Allow service role to manage verification logs
DROP POLICY IF EXISTS "Service role can manage verification logs" ON face_verification_logs;
CREATE POLICY "Service role can manage verification logs"
ON face_verification_logs FOR ALL
USING (auth.role() = 'service_role');
