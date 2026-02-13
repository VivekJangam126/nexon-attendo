-- ============================================
-- SET OFFICE GPS LOCATION FOR DEMO
-- Updates office coordinates to actual location
-- ============================================

-- Office Location:
-- Latitude: 18.5976337
-- Longitude: 73.8056611
-- Radius: 100 meters

-- ============================================
-- STEP 1: Update existing offices
-- ============================================

UPDATE offices
SET 
  latitude = 18.5976337,
  longitude = 73.8056611,
  radius_meters = 100
WHERE is_active = true;

-- ============================================
-- STEP 2: If no office exists, create one
-- ============================================

INSERT INTO offices (
  name,
  address,
  city,
  state,
  country,
  latitude,
  longitude,
  radius_meters,
  is_active
)
SELECT
  'Nexon Office',
  'Office Address',
  'Pune',
  'Maharashtra',
  'India',
  18.5976337,
  73.8056611,
  100,
  true
WHERE NOT EXISTS (SELECT 1 FROM offices WHERE is_active = true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check office coordinates
SELECT 
  id,
  name,
  city,
  latitude,
  longitude,
  radius_meters,
  is_active
FROM offices
WHERE is_active = true;

-- Expected result:
-- latitude: 18.5976337
-- longitude: 73.8056611
-- radius_meters: 100

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  office_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO office_count FROM offices WHERE is_active = true;
  
  IF office_count > 0 THEN
    RAISE NOTICE '✅ Office GPS location set successfully!';
    RAISE NOTICE '📍 Latitude: 18.5976337';
    RAISE NOTICE '📍 Longitude: 73.8056611';
    RAISE NOTICE '📏 Radius: 100 meters';
    RAISE NOTICE '🏢 Active offices: %', office_count;
  ELSE
    RAISE NOTICE '⚠️  No active offices found. Please check the data.';
  END IF;
END $$;
