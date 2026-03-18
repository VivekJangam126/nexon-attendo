-- Check abc user's face registration status specifically
SELECT 
    id,
    full_name,
    email,
    profile_photo_url IS NOT NULL as has_photo,
    face_registered,
    face_registered_at,
    created_at
FROM profiles 
WHERE email = 'abc@gamil.com';