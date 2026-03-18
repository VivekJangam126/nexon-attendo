-- Check Face Registration Mismatch
-- Compare database records with ML service registrations

-- Check the specific employee ID that has face data in ML service
SELECT 
  id,
  email,
  full_name,
  face_registered,
  face_registered_at,
  status,
  created_at
FROM profiles 
WHERE id = '10bc0a21-ddf5-464d-a8c0-24163dfc9eea';

-- Check all employees with face_registered = true
SELECT 
  id,
  email,
  full_name,
  face_registered,
  face_registered_at,
  status,
  created_at
FROM profiles 
WHERE face_registered = true
ORDER BY created_at DESC;

-- Check the most recent approved employee
SELECT 
  id,
  email,
  full_name,
  face_registered,
  face_registered_at,
  status,
  created_at
FROM profiles 
WHERE status = 'active' 
  AND role = 'employee'
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any pending employees who might have registered faces
SELECT 
  id,
  email,
  full_name,
  face_registered,
  face_registered_at,
  status,
  created_at
FROM profiles 
WHERE status = 'pending' 
  AND role = 'employee'
  AND face_registered = true
ORDER BY created_at DESC;