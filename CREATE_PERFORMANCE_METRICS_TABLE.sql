-- Create Performance Metrics Table and Fix Omkar's Data
-- This will ensure the performance analytics system works correctly

-- Create performance_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    total_working_days INTEGER DEFAULT 0,
    days_present INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    days_on_leave INTEGER DEFAULT 0,
    days_on_holiday INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5,2) DEFAULT 0,
    on_time_days INTEGER DEFAULT 0,
    late_days INTEGER DEFAULT 0,
    avg_late_minutes DECIMAL(5,2) DEFAULT 0,
    punctuality_score DECIMAL(5,2) DEFAULT 0,
    total_breaks INTEGER DEFAULT 0,
    avg_breaks_per_day DECIMAL(5,2) DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    avg_break_duration DECIMAL(5,2) DEFAULT 0,
    overall_score DECIMAL(5,2) DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- Create performance_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('yellow', 'red', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    metric_type VARCHAR(50),
    metric_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    period_start DATE,
    period_end DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alert_thresholds table if it doesn't exist
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL UNIQUE,
    yellow_threshold DECIMAL(10,2) NOT NULL,
    red_threshold DECIMAL(10,2) NOT NULL,
    critical_threshold DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance_metrics
DROP POLICY IF EXISTS "Users can view their own performance metrics" ON performance_metrics;
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (
        auth.uid() = employee_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage all performance metrics" ON performance_metrics;
CREATE POLICY "Admins can manage all performance metrics" ON performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for performance_alerts
DROP POLICY IF EXISTS "Users can view their own alerts" ON performance_alerts;
CREATE POLICY "Users can view their own alerts" ON performance_alerts
    FOR SELECT USING (
        auth.uid() = employee_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage all alerts" ON performance_alerts;
CREATE POLICY "Admins can manage all alerts" ON performance_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for alert_thresholds
DROP POLICY IF EXISTS "Admins can manage alert thresholds" ON alert_thresholds;
CREATE POLICY "Admins can manage alert thresholds" ON alert_thresholds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Insert default alert thresholds
INSERT INTO alert_thresholds (metric_type, yellow_threshold, red_threshold, critical_threshold, description) 
VALUES 
    ('attendance_rate', 85.0, 75.0, 60.0, 'Attendance rate percentage thresholds'),
    ('avg_late_minutes', 15.0, 30.0, 60.0, 'Average late arrival minutes thresholds'),
    ('breaks_per_day', 3.0, 5.0, 8.0, 'Average breaks per day thresholds')
ON CONFLICT (metric_type) DO NOTHING;

-- Now calculate and insert Omkar's performance metrics for current month
DO $$
DECLARE
    omkar_id UUID := 'f017bda9-1ac0-4296-9fe5-d0c29f35690e';
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    attendance_count INTEGER;
    present_count INTEGER;
    absent_count INTEGER;
    late_count INTEGER;
    on_time_count INTEGER;
    attendance_rate DECIMAL(5,2);
    punctuality_score DECIMAL(5,2);
BEGIN
    -- Get attendance statistics for current month
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('present', 'late')) as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) FILTER (WHERE status = 'late') as late,
        COUNT(*) FILTER (WHERE status = 'present') as on_time
    INTO attendance_count, present_count, absent_count, late_count, on_time_count
    FROM attendance 
    WHERE user_id = omkar_id 
    AND EXTRACT(MONTH FROM date) = current_month 
    AND EXTRACT(YEAR FROM date) = current_year;
    
    -- Calculate rates
    attendance_rate := CASE 
        WHEN attendance_count > 0 THEN (present_count::DECIMAL / attendance_count::DECIMAL) * 100 
        ELSE 0 
    END;
    
    punctuality_score := CASE 
        WHEN present_count > 0 THEN (on_time_count::DECIMAL / present_count::DECIMAL) * 100 
        ELSE 0 
    END;
    
    -- Insert or update performance metrics
    INSERT INTO performance_metrics (
        employee_id, month, year, total_working_days, days_present, days_absent,
        days_on_leave, days_on_holiday, attendance_rate, on_time_days, late_days,
        avg_late_minutes, punctuality_score, total_breaks, avg_breaks_per_day,
        total_break_minutes, avg_break_duration, overall_score, calculated_at
    ) VALUES (
        omkar_id, current_month, current_year, attendance_count, present_count, absent_count,
        0, 0, attendance_rate, on_time_count, late_count,
        0, punctuality_score, 0, 0,
        0, 0, attendance_rate, NOW()
    ) ON CONFLICT (employee_id, month, year) 
    DO UPDATE SET
        total_working_days = EXCLUDED.total_working_days,
        days_present = EXCLUDED.days_present,
        days_absent = EXCLUDED.days_absent,
        attendance_rate = EXCLUDED.attendance_rate,
        on_time_days = EXCLUDED.on_time_days,
        late_days = EXCLUDED.late_days,
        punctuality_score = EXCLUDED.punctuality_score,
        overall_score = EXCLUDED.overall_score,
        calculated_at = NOW(),
        updated_at = NOW();
        
    RAISE NOTICE 'Performance metrics updated for Omkar: % present, % absent, %.2f%% attendance rate', 
        present_count, absent_count, attendance_rate;
END $$;

-- Verify the data
SELECT 
    p.full_name,
    pm.total_working_days,
    pm.days_present,
    pm.days_absent,
    pm.attendance_rate,
    pm.overall_score
FROM performance_metrics pm
JOIN profiles p ON p.id = pm.employee_id
WHERE pm.employee_id = 'f017bda9-1ac0-4296-9fe5-d0c29f35690e'
AND pm.month = EXTRACT(MONTH FROM CURRENT_DATE)
AND pm.year = EXTRACT(YEAR FROM CURRENT_DATE);