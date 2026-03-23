-- Temporarily disable RLS to test if that's the issue
ALTER TABLE employee_work_applications DISABLE ROW LEVEL SECURITY;

-- Check if we can see the work applications now
SELECT 
    ewa.*,
    p.full_name,
    p.email
FROM employee_work_applications ewa
JOIN profiles p ON ewa.employee_id = p.id
WHERE ewa.holiday_date >= '2026-04-01' 
AND ewa.holiday_date <= '2026-04-30'
ORDER BY ewa.holiday_date;

-- Re-enable RLS after testing
-- ALTER TABLE employee_work_applications ENABLE ROW LEVEL SECURITY;