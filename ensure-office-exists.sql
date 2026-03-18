-- Ensure SmartMatrix office exists
INSERT INTO offices (id, name, location, latitude, longitude, is_active, created_at, updated_at)
VALUES (
    1,
    'SmartMatrix Pvt Ltd',
    'Pune, Maharashtra, India',
    18.5976337,
    73.8056611,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    is_active = true,
    updated_at = NOW();

-- Check the result
SELECT id, name, location, is_active FROM offices WHERE id = 1;