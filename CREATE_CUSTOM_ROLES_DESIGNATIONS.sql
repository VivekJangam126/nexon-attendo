-- Create tables for custom roles and designations

-- Custom Roles Table
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Designations Table
CREATE TABLE IF NOT EXISTS custom_designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_designations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read custom roles"
  ON custom_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read custom designations"
  ON custom_designations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies - Allow admins to insert
CREATE POLICY "Allow admins to insert custom roles"
  ON custom_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to insert custom designations"
  ON custom_designations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default roles
INSERT INTO custom_roles (name) VALUES
  ('Employee'),
  ('Intern'),
  ('Unpaid Intern'),
  ('Paid Intern')
ON CONFLICT (name) DO NOTHING;

-- Insert default designations
INSERT INTO custom_designations (name) VALUES
  ('Software Developer'),
  ('Frontend Developer'),
  ('Backend Developer'),
  ('HR Executive'),
  ('Project Manager'),
  ('UI/UX Designer')
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT * FROM custom_roles ORDER BY name;
SELECT * FROM custom_designations ORDER BY name;
