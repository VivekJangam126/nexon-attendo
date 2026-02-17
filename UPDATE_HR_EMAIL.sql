-- Update HR email to match Resend account email
-- This is needed because Resend free tier only allows sending to the account owner's email

UPDATE email_report_settings
SET hr_email = 'vivekjangam73@gmail.com'
WHERE is_active = true;

-- If no settings exist yet, insert default
INSERT INTO email_report_settings (hr_email, include_summary, is_active)
VALUES ('vivekjangam73@gmail.com', true, true)
ON CONFLICT DO NOTHING;

-- Verify the update
SELECT * FROM email_report_settings WHERE is_active = true;
