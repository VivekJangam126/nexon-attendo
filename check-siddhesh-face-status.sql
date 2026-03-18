-- Check Siddhesh's face registration status
SELECT 
    id,
    full_name,
    email,
    profile_photo_url,
    face_registered,
    face_registered_at,
    created_at
FROM profiles 
WHERE email = 'siddheshjabhav7@devconsoftware.com';