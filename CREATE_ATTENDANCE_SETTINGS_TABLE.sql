-- ============================================
-- ATTENDANCE SETTINGS TABLE
-- Stores admin-configurable attendance window
-- ============================================

-- Create attendance_settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active settings" ON attendance_settings;
DROP POLICY IF EXISTS "enable_read_settings" ON attendance_settings;

-- Policy: Anyone authenticated can read settings
CREATE POLICY "enable_read_settings"
  ON attendance_settings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default attendance window (09:30 AM to 6:00 PM)
INSERT INTO attendance_settings (setting_name, start_time, end_time, is_active)
VALUES ('default_attendance_window', '09:30:00', '18:00:00', true)
ON CONFLICT (setting_name) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_attendance_settings_active ON attendance_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_settings_name ON attendance_settings(setting_name);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_attendance_settings_updated_at ON attendance_settings;
CREATE TRIGGER update_attendance_settings_updated_at
  BEFORE UPDATE ON attendance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify
SELECT * FROM attendance_settings;
