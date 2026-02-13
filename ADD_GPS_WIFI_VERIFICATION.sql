-- ============================================
-- ADD GPS + WIFI VERIFICATION
-- Phase 4: Location and Network Verification
-- ============================================

-- ============================================
-- STEP 1: Add radius_meters to offices table
-- ============================================

ALTER TABLE offices 
ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 100;

COMMENT ON COLUMN offices.radius_meters IS 'Geofence radius in meters for attendance verification';

-- Update existing offices with default radius
UPDATE offices 
SET radius_meters = 100 
WHERE radius_meters IS NULL;

-- ============================================
-- STEP 2: Create office_networks table
-- ============================================

CREATE TABLE IF NOT EXISTS office_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  network_name TEXT NOT NULL,
  ip_range TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE office_networks IS 'Stores office network IP ranges for Wi-Fi verification';
COMMENT ON COLUMN office_networks.ip_range IS 'IP range prefix (e.g., 192.168.1. or 10.0.0.)';

-- Enable RLS on office_networks
ALTER TABLE office_networks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active networks" ON office_networks;
DROP POLICY IF EXISTS "enable_read_active_networks" ON office_networks;

-- Policy: Anyone authenticated can read active networks
CREATE POLICY "enable_read_active_networks"
  ON office_networks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- STEP 3: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_office_networks_office_id ON office_networks(office_id);
CREATE INDEX IF NOT EXISTS idx_office_networks_is_active ON office_networks(is_active);
CREATE INDEX IF NOT EXISTS idx_offices_radius ON offices(radius_meters);

-- ============================================
-- STEP 4: Create trigger for office_networks
-- ============================================

DROP TRIGGER IF EXISTS update_office_networks_updated_at ON office_networks;
CREATE TRIGGER update_office_networks_updated_at
  BEFORE UPDATE ON office_networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: Insert sample office networks
-- ============================================

-- Insert sample networks for existing offices
INSERT INTO office_networks (office_id, network_name, ip_range, is_active)
SELECT 
  id,
  'Office Network',
  '192.168.1.',
  true
FROM offices
WHERE NOT EXISTS (
  SELECT 1 FROM office_networks WHERE office_id = offices.id
);

-- ============================================
-- STEP 6: Update attendance table for GPS data
-- ============================================

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS ip_address TEXT;

COMMENT ON COLUMN attendance.latitude IS 'GPS latitude at check-in';
COMMENT ON COLUMN attendance.longitude IS 'GPS longitude at check-in';
COMMENT ON COLUMN attendance.ip_address IS 'IP address at check-in';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check offices have radius
SELECT name, latitude, longitude, radius_meters 
FROM offices 
WHERE is_active = true;

-- Check office networks
SELECT 
  o.name as office_name,
  onet.network_name,
  onet.ip_range,
  onet.is_active
FROM office_networks onet
JOIN offices o ON o.id = onet.office_id
WHERE onet.is_active = true;

-- Check attendance table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
AND column_name IN ('latitude', 'longitude', 'ip_address');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ GPS + Wi-Fi verification schema added successfully!';
  RAISE NOTICE '📍 Offices now have radius_meters';
  RAISE NOTICE '📡 office_networks table created';
  RAISE NOTICE '🗺️  Attendance table updated with GPS columns';
END $$;
