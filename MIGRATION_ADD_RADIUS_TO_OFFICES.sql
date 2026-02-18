-- ============================================
-- ADD RADIUS COLUMN TO OFFICES TABLE
-- Makes geofencing config-driven instead of hardcoded
-- ============================================

-- Add radius_in_meters column with default 100 meters
ALTER TABLE offices 
ADD COLUMN IF NOT EXISTS radius_in_meters INTEGER DEFAULT 100;

-- Update existing offices to have 100m radius
UPDATE offices 
SET radius_in_meters = 100 
WHERE radius_in_meters IS NULL;

-- Add comment
COMMENT ON COLUMN offices.radius_in_meters IS 'Geofencing radius in meters for attendance validation';
