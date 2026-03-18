-- Fix Face Registration Database Mismatch
-- Update database to match ML service registrations

-- First, let's see what profiles exist for the registered face IDs
SELECT 
  id,
  email,
  full_name,
  face_registered,
  face_registered_at,
  status,
  role
FROM profiles 
WHERE id IN (
  '10bc0a21-ddf5-464d-a8c0-24163dfc9eea',
  '1f0e05d0-bfe8-45f5-884d-d20b38c78b83',
  '320721ac-d01d-4508-94c7-db33165955b4',
  '5472a1c2-5858-48ad-81bf-68588e08f35d',
  'f5471376-7db6-4f2e-a8db-b57630d5a8ed',
  'f91eaa80-9cf3-45b5-954d-071485f4fc43'
);

-- Update the face_registered flag for employees who have face data in ML service
UPDATE profiles 
SET 
  face_registered = true,
  face_registered_at = NOW()
WHERE id IN (
  '10bc0a21-ddf5-464d-a8c0-24163dfc9eea',
  '1f0e05d0-bfe8-45f5-884d-d20b38c78b83',
  '320721ac-d01d-4508-94c7-db33165955b4',
  '5472a1c2-5858-48ad-81bf-68588e08f35d',
  'f5471376-7db6-4f2e-a8db-b57630d5a8ed',
  'f91eaa80-9cf3-45b5-954d-071485f4fc43'
)
AND role = 'employee';

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  face_registered,
  face_registered_at,
  status,
  role
FROM profiles 
WHERE face_registered = true
ORDER BY face_registered_at DESC;