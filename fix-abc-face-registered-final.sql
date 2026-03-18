-- Fix abc user's face registration status
UPDATE profiles 
SET 
    face_registered = true,
    face_registered_at = NOW()
WHERE 
    email = 'abc@gamil.com' 
    AND profile_photo_url IS NOT NULL;

-- Verify the fix
SELECT 
    id,
    full_name,
    email,
    profile_photo_url IS NOT NULL as has_photo,
    face_registered,
    face_registered_at
FROM profiles 
WHERE email = 'abc@gamil.com';