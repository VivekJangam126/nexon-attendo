-- ============================================
-- Notification System Database Schema
-- ============================================
-- Creates tables for notification settings and history

-- Table: notification_settings
-- Stores notification time slots and configuration
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number INTEGER NOT NULL CHECK (slot_number IN (1, 2, 3)),
  slot_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(slot_number)
);

-- Table: notification_contacts
-- Stores HR contact information for notifications
CREATE TABLE IF NOT EXISTS notification_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Table: notification_history
-- Audit trail of sent notifications
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number INTEGER NOT NULL,
  slot_time TEXT NOT NULL,
  notification_date DATE NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  message_id TEXT,
  error_message TEXT,
  attendance_data JSONB NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_by UUID REFERENCES auth.users(id),
  is_manual BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings
DROP POLICY IF EXISTS "Admins can view notification settings" ON notification_settings;
CREATE POLICY "Admins can view notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert notification settings" ON notification_settings;
CREATE POLICY "Admins can insert notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update notification settings" ON notification_settings;
CREATE POLICY "Admins can update notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete notification settings" ON notification_settings;
CREATE POLICY "Admins can delete notification settings"
  ON notification_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notification_contacts
DROP POLICY IF EXISTS "Admins can view notification contacts" ON notification_contacts;
CREATE POLICY "Admins can view notification contacts"
  ON notification_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert notification contacts" ON notification_contacts;
CREATE POLICY "Admins can insert notification contacts"
  ON notification_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update notification contacts" ON notification_contacts;
CREATE POLICY "Admins can update notification contacts"
  ON notification_contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete notification contacts" ON notification_contacts;
CREATE POLICY "Admins can delete notification contacts"
  ON notification_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notification_history
DROP POLICY IF EXISTS "Admins can view notification history" ON notification_history;
CREATE POLICY "Admins can view notification history"
  ON notification_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert notification history" ON notification_history;
CREATE POLICY "Admins can insert notification history"
  ON notification_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default notification slots (disabled by default)
INSERT INTO notification_settings (slot_number, slot_time, is_enabled)
VALUES 
  (1, '10:10:00', false),
  (2, '10:30:00', false),
  (3, '18:00:00', false)
ON CONFLICT (slot_number) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_history_date ON notification_history(notification_date DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_contacts_enabled ON notification_contacts(is_enabled) WHERE is_enabled = true;

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('notification_settings', 'notification_contacts', 'notification_history')
ORDER BY table_name;

-- Show default notification slots
SELECT 
  slot_number,
  slot_time,
  is_enabled,
  created_at
FROM notification_settings
ORDER BY slot_number;
