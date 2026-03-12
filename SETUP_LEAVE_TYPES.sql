-- Delete existing leave types to start fresh
DELETE FROM leave_types;

-- Insert leave types with correct IDs and max_per_year values
INSERT INTO leave_types (id, name, max_per_year) VALUES
  ('annual', 'Annual Leave', 25),
  ('sick', 'Sick Leave', 12),
  ('paid', 'Paid Leave', 10),
  ('unpaid', 'Unpaid Leave', 12);

-- Verify the data
SELECT * FROM leave_types;
