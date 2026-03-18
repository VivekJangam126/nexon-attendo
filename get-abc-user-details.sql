-- Get complete details for abc@gamil.com user
SELECT 
    id,
    full_name,
    email,
    profile_photo_url,
    face_registered,
    face_registered_at,
    created_at,
    status,
    role
FROM profiles 
WHERE email LIKE '%abc%' OR email LIKE '%gamil%' OR email LIKE '%gmail%'
ORDER BY created_at DESC;