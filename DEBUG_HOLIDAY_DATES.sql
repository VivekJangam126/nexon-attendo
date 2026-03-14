-- Debug holiday date calculation
-- Check what day of week each date is

-- Show day of week for recent dates
SELECT 
  date_series::date as date,
  EXTRACT(DOW FROM date_series::date) as day_of_week,
  CASE EXTRACT(DOW FROM date_series::date)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name
FROM generate_series(
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE,
  '1 day'::interval
) as date_series
ORDER BY date_series DESC;

-- Check employee recurring holidays
SELECT 
  p.full_name,
  erh.day_of_week,
  CASE erh.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name
FROM employee_recurring_holidays erh
JOIN profiles p ON erh.employee_id = p.id
ORDER BY p.full_name, erh.day_of_week;

-- Check if specific employee has Saturday/Sunday holidays
-- Replace 'EMPLOYEE_ID' with actual employee ID
-- SELECT 
--   day_of_week,
--   CASE day_of_week
--     WHEN 0 THEN 'Sunday'
--     WHEN 6 THEN 'Saturday'
--   END as day_name
-- FROM employee_recurring_holidays
-- WHERE employee_id = 'EMPLOYEE_ID'
-- AND day_of_week IN (0, 6);
