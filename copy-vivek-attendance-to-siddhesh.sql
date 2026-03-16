-- Copy Vivek's attendance data to Siddhesh Lalit Jadhav
-- First, get the user IDs
WITH user_ids AS (
  SELECT 
    (SELECT id FROM profiles WHERE email = 'vivekjangam@devconsoftware.com') as vivek_id,
    (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com') as siddhesh_id
)
-- Insert Vivek's attendance records for Siddhesh (excluding today's record to avoid duplicates)
INSERT INTO attendance (
  user_id,
  date,
  check_in_time,
  check_out_time,
  status,
  total_hours,
  break_duration,
  overtime_hours,
  location,
  ip_address,
  device_info,
  notes,
  created_at,
  updated_at
)
SELECT 
  u.siddhesh_id as user_id,
  a.date,
  a.check_in_time,
  a.check_out_time,
  a.status,
  a.total_hours,
  a.break_duration,
  a.overtime_hours,
  a.location,
  a.ip_address,
  a.device_info,
  a.notes,
  a.created_at,
  a.updated_at
FROM attendance a
CROSS JOIN user_ids u
WHERE a.user_id = u.vivek_id
  AND a.date != CURRENT_DATE  -- Exclude today's record to avoid conflicts
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM attendance a2 
    WHERE a2.user_id = u.siddhesh_id 
    AND a2.date = a.date
  );

-- Also copy break logs if any
WITH user_ids AS (
  SELECT 
    (SELECT id FROM profiles WHERE email = 'vivekjangam@devconsoftware.com') as vivek_id,
    (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com') as siddhesh_id
)
INSERT INTO break_logs (
  user_id,
  date,
  break_start,
  break_end,
  duration_minutes,
  break_type,
  notes,
  created_at
)
SELECT 
  u.siddhesh_id as user_id,
  bl.date,
  bl.break_start,
  bl.break_end,
  bl.duration_minutes,
  bl.break_type,
  bl.notes,
  bl.created_at
FROM break_logs bl
CROSS JOIN user_ids u
WHERE bl.user_id = u.vivek_id
  AND bl.date != CURRENT_DATE  -- Exclude today's record
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM break_logs bl2 
    WHERE bl2.user_id = u.siddhesh_id 
    AND bl2.date = bl.date
    AND bl2.break_start = bl.break_start
  );

-- Copy performance metrics if any
WITH user_ids AS (
  SELECT 
    (SELECT id FROM profiles WHERE email = 'vivekjangam@devconsoftware.com') as vivek_id,
    (SELECT id FROM profiles WHERE email = 'siddheshjabhav7@devconsoftware.com') as siddhesh_id
)
INSERT INTO performance_metrics (
  user_id,
  date,
  total_hours_worked,
  on_time_arrivals,
  late_arrivals,
  early_departures,
  overtime_hours,
  break_time_minutes,
  productivity_score,
  attendance_rate,
  punctuality_score,
  created_at,
  updated_at
)
SELECT 
  u.siddhesh_id as user_id,
  pm.date,
  pm.total_hours_worked,
  pm.on_time_arrivals,
  pm.late_arrivals,
  pm.early_departures,
  pm.overtime_hours,
  pm.break_time_minutes,
  pm.productivity_score,
  pm.attendance_rate,
  pm.punctuality_score,
  pm.created_at,
  pm.updated_at
FROM performance_metrics pm
CROSS JOIN user_ids u
WHERE pm.user_id = u.vivek_id
  AND pm.date != CURRENT_DATE  -- Exclude today's record
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM performance_metrics pm2 
    WHERE pm2.user_id = u.siddhesh_id 
    AND pm2.date = pm.date
  );

-- Verify the copy operation
SELECT 'Attendance Records Copied' as operation, COUNT(*) as count
FROM attendance a
JOIN profiles p ON a.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';

SELECT 'Break Logs Copied' as operation, COUNT(*) as count
FROM break_logs bl
JOIN profiles p ON bl.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';

SELECT 'Performance Metrics Copied' as operation, COUNT(*) as count
FROM performance_metrics pm
JOIN profiles p ON pm.user_id = p.id
WHERE p.email = 'siddheshjabhav7@devconsoftware.com';