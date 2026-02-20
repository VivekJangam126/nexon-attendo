-- ============================================
-- MOBILE APP BACKEND INTEGRATION
-- RPC Function for Attendance Marking
-- ============================================

-- This function is called by the mobile app to mark attendance
-- It reuses your existing backend validation logic

CREATE OR REPLACE FUNCTION mark_attendance(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_device_id TEXT,
  p_user_agent TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_office RECORD;
  v_window RECORD;
  v_today_date DATE;
  v_current_time TIME;
  v_distance DOUBLE PRECISION;
  v_status TEXT;
  v_attendance_id UUID;
  v_check_in_time TIMESTAMPTZ;
BEGIN
  -- Get today's date in IST
  v_today_date := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_current_time := (NOW() AT TIME ZONE 'Asia/Kolkata')::TIME;
  
  -- Get user profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found',
      'errorCode', 'UNAUTHORIZED'
    );
  END IF;
  
  -- Check if user is employee
  IF v_profile.role != 'employee' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only employees can mark attendance',
      'errorCode', 'NOT_EMPLOYEE'
    );
  END IF;
  
  -- Check if user is active
  IF v_profile.status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Account is not active',
      'errorCode', 'ACCOUNT_NOT_ACTIVE'
    );
  END IF;
  
  -- Check if office assigned
  IF v_profile.office_location IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No office assigned',
      'errorCode', 'NO_OFFICE_ASSIGNED'
    );
  END IF;
  
  -- Check if already marked today
  IF EXISTS (
    SELECT 1 FROM attendance
    WHERE user_id = p_user_id
    AND date = v_today_date
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Attendance already marked for today',
      'errorCode', 'ATTENDANCE_ALREADY_MARKED'
    );
  END IF;
  
  -- Get attendance window
  SELECT * INTO v_window
  FROM attendance_settings
  WHERE setting_name = 'default_attendance_window'
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Attendance window not configured',
      'errorCode', 'VALIDATION_FAILED'
    );
  END IF;
  
  -- Check if window is open
  IF v_current_time < v_window.start_time OR v_current_time > v_window.end_time THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Attendance window is closed',
      'errorCode', 'ATTENDANCE_CLOSED'
    );
  END IF;
  
  -- Get office details
  SELECT * INTO v_office
  FROM offices
  WHERE id = v_profile.office_location
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Office not found or inactive',
      'errorCode', 'VALIDATION_FAILED'
    );
  END IF;
  
  -- If strict mode, validate GPS
  IF v_window.strict_mode THEN
    IF p_latitude IS NULL OR p_longitude IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Location is required in strict mode',
        'errorCode', 'GPS_REQUIRED'
      );
    END IF;
    
    -- Calculate distance using Haversine formula
    v_distance := 6371000 * acos(
      cos(radians(v_office.latitude)) *
      cos(radians(p_latitude)) *
      cos(radians(p_longitude) - radians(v_office.longitude)) +
      sin(radians(v_office.latitude)) *
      sin(radians(p_latitude))
    );
    
    -- Check if within radius
    IF v_distance > v_office.radius_in_meters THEN
      RETURN json_build_object(
        'success', false,
        'error', format('You are outside office premises. Distance: %sm (allowed: %sm)', 
                       ROUND(v_distance), v_office.radius_in_meters),
        'errorCode', 'OUTSIDE_OFFICE_LOCATION'
      );
    END IF;
  END IF;
  
  -- Determine status (present or late)
  IF v_current_time <= (v_window.start_time + (v_window.grace_period_minutes || ' minutes')::INTERVAL) THEN
    v_status := 'present';
  ELSE
    v_status := 'late';
  END IF;
  
  -- Mark attendance
  v_check_in_time := NOW();
  
  INSERT INTO attendance (
    user_id,
    date,
    check_in_time,
    status,
    office_id,
    latitude,
    longitude,
    device_id,
    user_agent
  ) VALUES (
    p_user_id,
    v_today_date,
    v_check_in_time,
    v_status,
    v_office.id,
    p_latitude,
    p_longitude,
    p_device_id,
    p_user_agent
  )
  RETURNING id INTO v_attendance_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'attendance', json_build_object(
      'id', v_attendance_id,
      'user_id', p_user_id,
      'date', v_today_date,
      'check_in_time', v_check_in_time,
      'status', v_status,
      'office_id', v_office.id
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'errorCode', 'VALIDATION_FAILED'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_attendance TO authenticated;

-- ============================================
-- TESTING THE FUNCTION
-- ============================================

-- Test 1: Mark attendance (replace with your user_id)
-- SELECT mark_attendance(
--   'your-user-id-here'::UUID,
--   28.6139,  -- latitude
--   77.2090,  -- longitude
--   'test-device-id',
--   'Nexus-Attendo-Mobile/1.0.0'
-- );
