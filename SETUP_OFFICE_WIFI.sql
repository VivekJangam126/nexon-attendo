-- ============================================
-- SETUP OFFICE WI-FI CONFIGURATION
-- SmartMatrix Pvt Ltd - Router: 192.168.1.1
-- ============================================

-- Office Wi-Fi Configuration:
-- Router IP: 192.168.1.1
-- Subnet: 255.255.255.0
-- IP Prefix: 192.168.1.

-- ============================================
-- STEP 1: Clear existing office networks
-- ============================================

DELETE FROM office_networks;

-- ============================================
-- STEP 2: Add SmartMatrix office network
-- ============================================

INSERT INTO office_networks (
  office_id,
  network_name,
  ip_range,
  is_active
)
SELECT
  id,
  'SmartMatrix Office Wi-Fi',
  '192.168.1.',
  true
FROM offices
WHERE name = 'SmartMatrix Pvt Ltd'
AND is_active = true;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check office networks
SELECT 
  onet.id,
  o.name as office_name,
  onet.network_name,
  onet.ip_range,
  onet.is_active
FROM office_networks onet
JOIN offices o ON o.id = onet.office_id
WHERE onet.is_active = true;

-- Expected result:
-- office_name: SmartMatrix Pvt Ltd
-- network_name: SmartMatrix Office Wi-Fi
-- ip_range: 192.168.1.
-- is_active: true

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  network_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO network_count
  FROM office_networks
  WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ OFFICE WI-FI CONFIGURED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🏢 Office: SmartMatrix Pvt Ltd';
  RAISE NOTICE '📡 Network: SmartMatrix Office Wi-Fi';
  RAISE NOTICE '🌐 Router IP: 192.168.1.1';
  RAISE NOTICE '📍 IP Prefix: 192.168.1.';
  RAISE NOTICE '✅ Active networks: %', network_count;
  RAISE NOTICE '========================================';
  
  IF network_count != 1 THEN
    RAISE WARNING '⚠️  Expected 1 active network, found %', network_count;
  END IF;
END $$;
