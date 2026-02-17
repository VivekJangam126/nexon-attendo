-- Migration: Email Report Settings and Logs
-- Description: Add tables for email report configuration and delivery tracking

-- Table 1: Email Report Settings
CREATE TABLE IF NOT EXISTS email_report_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hr_email TEXT NOT NULL,
  cc_emails TEXT[], -- Array of additional recipient emails
  include_summary BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Email Report Logs
CREATE TABLE IF NOT EXISTS email_report_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sent_to TEXT NOT NULL,
  cc_emails TEXT[],
  report_type TEXT NOT NULL, -- 'today', 'week', 'month', 'custom'
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  pdf_size_kb INTEGER,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO email_report_settings (hr_email, include_summary, is_active)
VALUES ('vivekjangam9767@gmail.com', true, true)
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_report_logs_sent_by ON email_report_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_email_report_logs_sent_at ON email_report_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_report_logs_status ON email_report_logs(status);

-- Add RLS policies
ALTER TABLE email_report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_report_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view/edit email settings
CREATE POLICY "Admins can view email settings" ON email_report_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update email settings" ON email_report_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can view email logs
CREATE POLICY "Admins can view email logs" ON email_report_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert email logs
CREATE POLICY "Admins can insert email logs" ON email_report_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE email_report_settings IS 'Stores configuration for automated email reports';
COMMENT ON TABLE email_report_logs IS 'Tracks all email report deliveries and their status';
COMMENT ON COLUMN email_report_settings.hr_email IS 'Primary recipient email address (HR manager)';
COMMENT ON COLUMN email_report_settings.cc_emails IS 'Additional recipients to CC on reports';
COMMENT ON COLUMN email_report_settings.include_summary IS 'Whether to include attendance summary in email body';
COMMENT ON COLUMN email_report_logs.status IS 'Delivery status: sent, failed, or pending';
COMMENT ON COLUMN email_report_logs.pdf_size_kb IS 'Size of the PDF attachment in kilobytes';
