-- Fix Face Registration for Employees with Photos
-- These employees have photos but face_registered = false

-- Update employees who have photos to enable face registration
UPDATE profiles 
SET 
  face_registered = true, 
  face_registered_at = NOW() 
WHERE 
  profile_photo_url IS NOT NULL 
  AND profile_photo_url != '' 
  AND face_registered = false 
  AND role = 'employee';

-- Verify the update
SELECT 
  full_name, 
  email, 
  face_registered, 
  face_registered_at,
  CASE 
    WHEN profile_photo_url IS NOT NULL THEN 'Has Photo' 
    ELSE 'No Photo' 
  END as photo_status
FROM profiles 
WHERE role = 'employee' 
  AND profile_photo_url IS NOT NULL
ORDER BY face_registered_at DESC;