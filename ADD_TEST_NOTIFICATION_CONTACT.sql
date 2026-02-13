-- ============================================
-- STEP 1: Run CREATE_NOTIFICATION_TABLES.sql first if you haven't!
-- ============================================

-- ============================================
-- STEP 2: Add a test HR contact
-- ============================================
-- Replace the email and phone with YOUR actual contact details

INSERT INTO notification_contacts (name, email, phone, is_enabled, created_by)
VALUES (
  'HR Manager',
  'vivekjangam73@gmail.com',        -- ⚠️ REPLACE with your actual email
  '+919767996768',             -- ⚠️ REPLACE with your actual phone (E.164 format: +91XXXXXXXXXX)
  true,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- ============================================
-- STEP 3: Verify the contact was added
-- ============================================
SELECT 
  id,
  name,
  email,
  phone,
  is_enabled,
  created_at
FROM notification_contacts;

-- ✅ If you see the contact listed above, you're ready to send notifications!
-- 
-- IMPORTANT NOTES:
-- - Phone must be in E.164 format: +919876543210 (no spaces, parentheses, or dashes)
-- - For India: +91XXXXXXXXXX (10 digits after +91)
-- - For US: +1XXXXXXXXXX (10 digits after +1)
-- - Make sure is_enabled = true
-- 
-- After adding contacts, go to Admin → Reports → Send Alert to test!
