-- Check the most recent user registration
SELECT 
    id,
    email,
    full_name,
    face_registered,
    face_registered_at,
    created_at,
    status
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;