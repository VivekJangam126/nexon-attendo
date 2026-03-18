-- Fix abc@gmail.com face registration status
-- This sets face_registered to true if a profile photo exists

UPDATE profiles 
SET 
    face_registered = true,
    face_registered_at = NOW()
WHERE 
    (email = 'abc@gamil.com' OR email = 'abc@gmail.com')
    AND profile_photo_url IS NOT NULL 
    AND profile_photo_url != '';

-- Verify the update
SELECT 
    id,
    full_name,
    email,
    profile_photo_url,
    face_registered,
    face_registered_at
FROM profiles 
WHERE email = 'abc@gamil.com' OR email = 'abc@gmail.com';