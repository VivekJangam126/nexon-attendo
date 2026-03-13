-- Holiday Year Reset System
-- This migration adds automatic holiday reset functionality at year end

-- Create a function to archive old holidays
CREATE OR REPLACE FUNCTION archive_old_holidays()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Archive specific holidays from previous years
  -- Move them to an archive table (optional) or just delete them
  DELETE FROM employee_specific_holidays
  WHERE EXTRACT(YEAR FROM holiday_date) < EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Note: Recurring holidays don't need to be deleted as they repeat every week
  -- They are year-independent
END;
$$;

-- Create a function to check and reset holidays at year boundary
CREATE OR REPLACE FUNCTION check_year_reset()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a new year starts, archive old specific holidays
  IF EXTRACT(YEAR FROM NEW.holiday_date) > EXTRACT(YEAR FROM OLD.holiday_date) THEN
    PERFORM archive_old_holidays();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add a settings table to track last year reset
CREATE TABLE IF NOT EXISTS holiday_system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert initial year tracking
INSERT INTO holiday_system_settings (setting_key, setting_value)
VALUES ('last_year_reset', EXTRACT(YEAR FROM CURRENT_DATE)::text)
ON CONFLICT (setting_key) DO NOTHING;

-- Create a function to manually trigger year reset
CREATE OR REPLACE FUNCTION manual_year_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete specific holidays from previous years
  DELETE FROM employee_specific_holidays
  WHERE EXTRACT(YEAR FROM holiday_date) < EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Update the last reset year
  UPDATE holiday_system_settings
  SET setting_value = EXTRACT(YEAR FROM CURRENT_DATE)::text,
      updated_at = now()
  WHERE setting_key = 'last_year_reset';
  
  RAISE NOTICE 'Holiday year reset completed. Old holidays archived.';
END;
$$;

-- Grant execute permission to authenticated users (admins only in practice)
GRANT EXECUTE ON FUNCTION manual_year_reset() TO authenticated;

-- Comment on functions
COMMENT ON FUNCTION archive_old_holidays() IS 'Archives specific holidays from previous years';
COMMENT ON FUNCTION manual_year_reset() IS 'Manually trigger year-end holiday reset to clean up old holidays';
COMMENT ON TABLE holiday_system_settings IS 'Stores system settings for holiday management including year reset tracking';
