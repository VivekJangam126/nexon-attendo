-- Performance Analytics System Database Schema
-- Phase 1: Analytics Foundation Tables

-- Performance Metrics Table (Monthly aggregates)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    
    -- Attendance Metrics
    total_working_days INTEGER NOT NULL DEFAULT 0,
    days_present INTEGER NOT NULL DEFAULT 0,
    days_absent INTEGER NOT NULL DEFAULT 0,
    days_on_leave INTEGER NOT NULL DEFAULT 0,
    days_on_holiday INTEGER NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Punctuality Metrics
    on_time_days INTEGER NOT NULL DEFAULT 0,
    late_days INTEGER NOT NULL DEFAULT 0,
    avg_late_minutes DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    punctuality_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Break Metrics
    total_breaks INTEGER NOT NULL DEFAULT 0,
    avg_breaks_per_day DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_break_minutes INTEGER NOT NULL DEFAULT 0,
    avg_break_duration DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    
    -- Overall Performance Score (0-100)
    overall_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate monthly records
    UNIQUE(employee_id, month, year)
);

-- Performance Alerts Table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'excessive_breaks', 'late_pattern', 'low_attendance'
    severity VARCHAR(20) NOT NULL DEFAULT 'yellow', -- 'yellow', 'red', 'critical'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Alert Data
    metric_type VARCHAR(50), -- 'breaks_per_day', 'late_arrivals', 'attendance_rate'
    metric_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    period_start DATE,
    period_end DATE,
    
    -- Alert Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert Thresholds Table (Configurable thresholds)
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL UNIQUE,
    yellow_threshold DECIMAL(10,2) NOT NULL,
    red_threshold DECIMAL(10,2) NOT NULL,
    critical_threshold DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default alert thresholds
INSERT INTO alert_thresholds (metric_type, yellow_threshold, red_threshold, critical_threshold, description) VALUES
('breaks_per_day', 3.0, 4.0, 5.0, 'Average breaks per day threshold'),
('late_arrivals_per_week', 2.0, 3.0, 4.0, 'Late arrivals per week threshold'),
('attendance_rate', 85.0, 75.0, 65.0, 'Monthly attendance rate threshold (percentage)'),
('avg_late_minutes', 15.0, 30.0, 45.0, 'Average late arrival minutes threshold')
ON CONFLICT (metric_type) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_employee_date ON performance_metrics(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_employee ON performance_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_status ON performance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_type ON performance_alerts(alert_type);

-- RLS Policies
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Performance Metrics Policies
CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Employees can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update performance metrics" ON performance_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Performance Alerts Policies
CREATE POLICY "Admins can view all performance alerts" ON performance_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Employees can view their own performance alerts" ON performance_alerts
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage performance alerts" ON performance_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Alert Thresholds Policies
CREATE POLICY "Admins can manage alert thresholds" ON alert_thresholds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "All users can view alert thresholds" ON alert_thresholds
    FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE performance_metrics IS 'Monthly performance metrics aggregated for each employee';
COMMENT ON TABLE performance_alerts IS 'Performance alerts generated based on threshold violations';
COMMENT ON TABLE alert_thresholds IS 'Configurable thresholds for generating performance alerts';