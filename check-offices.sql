-- Check available offices
SELECT 
    id,
    name,
    location,
    latitude,
    longitude,
    is_active,
    created_at
FROM offices 
ORDER BY id;