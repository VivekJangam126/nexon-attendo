-- ============================================
-- Master Public Holidays Table
-- Pre-populated calendar like Kalnirnaya
-- ============================================
-- This table stores the master list of public holidays
-- that appear on the calendar in red for reference
-- Admin can see these and then assign to employees
-- ============================================

-- Table: master_public_holidays
-- Stores public holidays and festivals for reference
CREATE TABLE IF NOT EXISTS master_public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL,
  holiday_name TEXT NOT NULL,
  holiday_type TEXT NOT NULL CHECK (holiday_type IN ('national', 'festival', 'state', 'optional')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique date
  UNIQUE(holiday_date)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_master_holidays_date ON master_public_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_master_holidays_active ON master_public_holidays(is_active);

-- RLS Policies - Everyone can read, only admins can manage
ALTER TABLE master_public_holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view master holidays
CREATE POLICY "Everyone can view master holidays"
  ON master_public_holidays
  FOR SELECT
  USING (true);

-- Only admins can manage master holidays
CREATE POLICY "Admins can manage master holidays"
  ON master_public_holidays
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

-- Insert Indian Public Holidays for 2026
INSERT INTO master_public_holidays (holiday_date, holiday_name, holiday_type, description) VALUES
-- National Holidays
('2026-01-26', 'Republic Day', 'national', 'National holiday celebrating the adoption of the Constitution of India'),
('2026-08-15', 'Independence Day', 'national', 'National holiday celebrating independence from British rule'),
('2026-10-02', 'Gandhi Jayanti', 'national', 'Birthday of Mahatma Gandhi'),

-- Major Festivals
('2026-03-06', 'Maha Shivaratri', 'festival', 'Hindu festival dedicated to Lord Shiva'),
('2026-03-14', 'Holi', 'festival', 'Festival of colors'),
('2026-03-25', 'Gudi Padwa', 'festival', 'Marathi New Year'),
('2026-04-02', 'Ram Navami', 'festival', 'Birthday of Lord Rama'),
('2026-04-06', 'Mahavir Jayanti', 'festival', 'Birthday of Lord Mahavira'),
('2026-04-10', 'Good Friday', 'festival', 'Christian holiday commemorating the crucifixion of Jesus'),
('2026-04-14', 'Ambedkar Jayanti', 'national', 'Birthday of Dr. B.R. Ambedkar'),
('2026-05-01', 'Maharashtra Day', 'state', 'Formation day of Maharashtra state'),
('2026-05-26', 'Buddha Purnima', 'festival', 'Birthday of Gautama Buddha'),
('2026-07-31', 'Eid ul-Fitr', 'festival', 'Islamic festival marking the end of Ramadan'),
('2026-08-12', 'Raksha Bandhan', 'festival', 'Festival celebrating brother-sister bond'),
('2026-08-19', 'Janmashtami', 'festival', 'Birthday of Lord Krishna'),
('2026-09-02', 'Ganesh Chaturthi', 'festival', 'Birthday of Lord Ganesha'),
('2026-10-08', 'Eid ul-Adha', 'festival', 'Islamic festival of sacrifice'),
('2026-10-17', 'Dussehra', 'festival', 'Victory of good over evil'),
('2026-10-28', 'Muharram', 'festival', 'Islamic New Year'),
('2026-11-05', 'Diwali', 'festival', 'Festival of lights'),
('2026-11-06', 'Govardhan Puja', 'festival', 'Day after Diwali'),
('2026-11-07', 'Bhai Dooj', 'festival', 'Festival celebrating brother-sister bond'),
('2026-11-16', 'Guru Nanak Jayanti', 'festival', 'Birthday of Guru Nanak'),
('2026-12-25', 'Christmas', 'festival', 'Birthday of Jesus Christ')
ON CONFLICT (holiday_date) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE master_public_holidays IS 'Master list of public holidays and festivals shown on calendar for reference';
COMMENT ON COLUMN master_public_holidays.holiday_type IS 'Type: national (all India), festival (religious), state (state-specific), optional (optional holiday)';
