-- Create break_logs table for storing employee break data
CREATE TABLE IF NOT EXISTS break_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    break_type VARCHAR(20) NOT NULL DEFAULT 'tea',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NULL,
    created_by UUID REFERENCES profiles(id), -- Track who created (employee or admin)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_break_logs_employee_id ON break_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_break_logs_start_time ON break_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_break_logs_employee_start_time ON break_logs(employee_id, start_time);

-- Enable RLS (Row Level Security)
ALTER TABLE break_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can only see their own break logs
CREATE POLICY "Employees can view own break logs" ON break_logs
    FOR SELECT USING (
        auth.uid() = employee_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Employees can insert their own break logs
CREATE POLICY "Employees can insert own break logs" ON break_logs
    FOR INSERT WITH CHECK (
        auth.uid() = employee_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Employees and admins can update break logs
CREATE POLICY "Employees and admins can update break logs" ON break_logs
    FOR UPDATE USING (
        auth.uid() = employee_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_break_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_break_logs_updated_at
    BEFORE UPDATE ON break_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_break_logs_updated_at();