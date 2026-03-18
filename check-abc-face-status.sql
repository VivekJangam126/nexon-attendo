-- Check abc@gmail.com face registration status
SELECT 
    id,
    full_name,
    email,
    profile_photo_url,
    face_registered,
    face_registered_at,
    created_at
FROM profiles 
WHERE email = 'abc@gamil.com' OR email = 'abc@gmail.com';