-- ============================================
-- Holiday & Work Schedule Management System
-- ============================================
-- This migration creates tables for managing:
-- 1. Recurring weekly holidays (e.g., Saturday/Sunday)
-- 2. Specific date holidays (e.g., Holi, Diwali)
-- 3. Employee-specific holiday assignments
-- ============================================

-- Table: employee_recurring_holidays
-- Stores weekly recurring holidays for employees
CREATE TABLE IF NOT EXISTS employee_recurring_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of employee and day
  UNIQUE(employee_id, day_of_week)
);

-- Table: employee_specific_holidays
-- Stores specific date holidays for employees
CREATE TABLE IF NOT EXISTS employee_specific_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  holiday_type TEXT NOT NULL CHECK (holiday_type IN ('public_holiday', 'festival', 'company_event', 'other')),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of employee and date
  UNIQUE(employee_id, holiday_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_holidays_employee ON employee_recurring_holidays(employee_id);
CREATE INDEX IF NOT EXISTS idx_recurring_holidays_day ON employee_recurring_holidays(day_of_week);
CREATE INDEX IF NOT EXISTS idx_specific_holidays_employee ON employee_specific_holidays(employee_id);
CREATE INDEX IF NOT EXISTS idx_specific_holidays_date ON employee_specific_holidays(holiday_date);

-- RLS Policies for employee_recurring_holidays
ALTER TABLE employee_recurring_holidays ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all recurring holidays"
  ON employee_recurring_holidays
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Employees can view their own recurring holidays
CREATE POLICY "Employees can view their own recurring holidays"
  ON employee_recurring_holidays
  FOR SELECT
  USING (employee_id = auth.uid());

-- RLS Policies for employee_specific_holidays
ALTER TABLE employee_specific_holidays ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all specific holidays"
  ON employee_specific_holidays
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Employees can view their own specific holidays
CREATE POLICY "Employees can view their own specific holidays"
  ON employee_specific_holidays
  FOR SELECT
  USING (employee_id = auth.uid());

-- Function: Check if a date is a holiday for an employee
CREATE OR REPLACE FUNCTION is_employee_holiday(
  p_employee_id UUID,
  p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_is_recurring_holiday BOOLEAN;
  v_is_specific_holiday BOOLEAN;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check recurring holiday
  SELECT EXISTS (
    SELECT 1 FROM employee_recurring_holidays
    WHERE employee_id = p_employee_id
    AND day_of_week = v_day_of_week
  ) INTO v_is_recurring_holiday;
  
  -- Check specific holiday
  SELECT EXISTS (
    SELECT 1 FROM employee_specific_holidays
    WHERE employee_id = p_employee_id
    AND holiday_date = p_date
  ) INTO v_is_specific_holiday;
  
  -- Return true if either type of holiday exists
  RETURN v_is_recurring_holiday OR v_is_specific_holiday;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_employee_holiday(UUID, DATE) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE employee_recurring_holidays IS 'Stores weekly recurring holidays for employees (e.g., Saturday/Sunday off)';
COMMENT ON TABLE employee_specific_holidays IS 'Stores specific date holidays for employees (e.g., Holi, Diwali, company events)';
COMMENT ON FUNCTION is_employee_holiday(UUID, DATE) IS 'Checks if a given date is a holiday for a specific employee';
