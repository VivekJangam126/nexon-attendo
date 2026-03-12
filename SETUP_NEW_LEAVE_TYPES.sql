-- Complete Leave Types Setup
-- Delete all existing leave types
DELETE FROM leave_types;

-- Insert new leave types with correct allocations
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Sick Leave', 5),
  ('Paid Leave', 10),
  ('Unpaid Leave', 10);

-- Verify
SELECT id, name, max_per_year FROM leave_types ORDER BY name;
