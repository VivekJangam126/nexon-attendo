-- Copy Vivek's attendance data to Siddhesh with correct email
-- Step 1: Check if both users exist
SELECT 'User Check' as step, p.full_name, p.email, p.id
FROM profiles p 
WHERE p.email IN ('vivekjangam126@devconsoftware.com', 'siddheshjabhav7@devconsoftware.com')
ORDER BY p.email;

-- Step 2: Check Vivek's attendance count
SELECT 'Vivek Attendance Count' as step, COUNT(*) as total_records
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'vivekjangam126@devconsoftware.com';

-- Step 3: Check Siddhesh's current attendance count
SELECT 'Siddhesh Current Count' as step, COUNT(*) as total_records
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';

-- Step 4: Show some of Vivek's records to verify data exists
SELECT 'Sample Vivek Records' as step, a.date, a.check_in_time, a.status
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'vivekjangam126@devconsoftware.com'
ORDER BY a.date DESC
LIMIT 5;

-- Step 5: Copy Vivek's attendance to Siddhesh
WITH user_mapping AS (
  SELECT 
    vivek.id as vivek_id,
    siddhesh.id as siddhesh_id
  FROM 
    (SELECT id FROM profiles WHERE email = 'vivekjangam126@devconsoftware.com') vivek,
    (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com') siddhesh
)
INSERT INTO attendance (
  user_id,
  date,
  check_in_time,
  check_out_time,
  status,
  created_at
)
SELECT 
  um.siddhesh_id,
  a.date,
  a.check_in_time,
  a.check_out_time,
  a.status,
  a.created_at
FROM attendance a
CROSS JOIN user_mapping um
WHERE a.user_id = um.vivek_id
  AND a.date < CURRENT_DATE  -- Only copy past records, not today
  AND NOT EXISTS (
    SELECT 1 FROM attendance existing 
    WHERE existing.user_id = um.siddhesh_id 
    AND existing.date = a.date
  );

-- Step 6: Verify the copy operation
SELECT 'Final Siddhesh Count' as step, COUNT(*) as total_records
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';

-- Step 7: Show recent attendance for Siddhesh
SELECT 'Recent Siddhesh Records' as step, a.date, a.check_in_time, a.status
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com'
ORDER BY a.date DESC
LIMIT 10;