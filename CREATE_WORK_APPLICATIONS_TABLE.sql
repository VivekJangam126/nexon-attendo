-- Create employee_work_applications table for tracking when employees want to work on holidays

CREATE TABLE IF NOT EXISTS employee_work_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one application per employee per date
    UNIQUE(employee_id, holiday_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_applications_employee_id ON employee_work_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_applications_holiday_date ON employee_work_applications(holiday_date);
CREATE INDEX IF NOT EXISTS idx_work_applications_status ON employee_work_applications(status);

-- Enable RLS
ALTER TABLE employee_work_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees can view and insert their own applications
CREATE POLICY "Employees can view own work applications" ON employee_work_applications
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own work applications" ON employee_work_applications
    FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Admins can view and update all applications
CREATE POLICY "Admins can view all work applications" ON employee_work_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (
                full_name ILIKE '%admin%' 
                OR full_name = 'Siddhesh Lalit Jadhav'
                OR email ILIKE '%admin%'
            )
        )
    );

CREATE POLICY "Admins can update work applications" ON employee_work_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (
                full_name ILIKE '%admin%' 
                OR full_name = 'Siddhesh Lalit Jadhav'
                OR email ILIKE '%admin%'
            )
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_work_applications_updated_at
    BEFORE UPDATE ON employee_work_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_work_applications_updated_at();

-- Insert some test data (optional)
-- This will be handled by the application  