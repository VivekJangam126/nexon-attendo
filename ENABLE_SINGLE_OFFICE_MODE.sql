-- ============================================
-- ENABLE SINGLE OFFICE MODE
-- SmartMatrix Pvt Ltd - Demo Configuration
-- ============================================

-- ============================================
-- STEP 1: Deactivate all existing offices
-- ============================================

UPDATE offices
SET is_active = false;

-- ============================================
-- STEP 2: Create/Update SmartMatrix office
-- ============================================

-- Delete existing SmartMatrix office if any
DELETE FROM offices 
WHERE name = 'SmartMatrix Pvt Ltd';

-- Create the single active office
INSERT INTO offices (
  name,
  address,
  city,
  state,
  country,
  latitude,
  longitude,
  radius_meters,
  wifi_ssids,
  is_active
)
VALUES (
  'SmartMatrix Pvt Ltd',
  'Office Address, Pune',
  'Pune',
  'Maharashtra',
  'India',
  18.5976337,
  73.8056611,
  100,
  ARRAY['SmartMatrix-WiFi', 'SmartMatrix-Guest'],
  true
);

-- ============================================
-- STEP 3: Auto-assign ALL employees to SmartMatrix
-- ============================================

-- Get the SmartMatrix office ID
DO $$
DECLARE
  smartmatrix_office_id UUID;
BEGIN
  -- Get SmartMatrix office ID
  SELECT id INTO smartmatrix_office_id
  FROM offices
  WHERE name = 'SmartMatrix Pvt Ltd'
  AND is_active = true
  LIMIT 1;

  -- Assign all employees to SmartMatrix
  UPDATE profiles
  SET office_location = smartmatrix_office_id
  WHERE role = 'employee';

  RAISE NOTICE '✅ All employees assigned to SmartMatrix Pvt Ltd';
END $$;

-- ============================================
-- STEP 4: Create office network for SmartMatrix
-- ============================================

-- Delete existing networks
DELETE FROM office_networks
WHERE office_id IN (SELECT id FROM offices WHERE name = 'SmartMatrix Pvt Ltd');

-- Add SmartMatrix network
INSERT INTO office_networks (
  office_id,
  network_name,
  ip_range,
  is_active
)
SELECT
  id,
  'SmartMatrix Office Network',
  '192.168.1.',
  true
FROM offices
WHERE name = 'SmartMatrix Pvt Ltd'
AND is_active = true;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check active offices (should be exactly 1)
SELECT 
  COUNT(*) as active_office_count,
  'Expected: 1' as expected
FROM offices
WHERE is_active = true;

-- Show SmartMatrix office details
SELECT 
  id,
  name,
  city,
  latitude,
  longitude,
  radius_meters,
  is_active
FROM offices
WHERE name = 'SmartMatrix Pvt Ltd';

-- Check employee assignments
SELECT 
  COUNT(*) as total_employees,
  COUNT(office_location) as assigned_employees,
  COUNT(*) - COUNT(office_location) as unassigned_employees
FROM profiles
WHERE role = 'employee';

-- Show employees without office (should be 0)
SELECT 
  email,
  full_name,
  office_location
FROM profiles
WHERE role = 'employee'
AND office_location IS NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  office_count INTEGER;
  employee_count INTEGER;
  assigned_count INTEGER;
BEGIN
  -- Count active offices
  SELECT COUNT(*) INTO office_count
  FROM offices
  WHERE is_active = true;

  -- Count employees
  SELECT COUNT(*) INTO employee_count
  FROM profiles
  WHERE role = 'employee';

  -- Count assigned employees
  SELECT COUNT(*) INTO assigned_count
  FROM profiles
  WHERE role = 'employee'
  AND office_location IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SINGLE OFFICE MODE ENABLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🏢 Active offices: %', office_count;
  RAISE NOTICE '📍 Office: SmartMatrix Pvt Ltd';
  RAISE NOTICE '📍 Location: 18.5976337, 73.8056611';
  RAISE NOTICE '📏 Radius: 100 meters';
  RAISE NOTICE '👥 Total employees: %', employee_count;
  RAISE NOTICE '✅ Assigned employees: %', assigned_count;
  RAISE NOTICE '========================================';
  
  IF office_count != 1 THEN
    RAISE WARNING '⚠️  Expected 1 active office, found %', office_count;
  END IF;
  
  IF assigned_count != employee_count THEN
    RAISE WARNING '⚠️  % employees not assigned to office', (employee_count - assigned_count);
  END IF;
END $$;
