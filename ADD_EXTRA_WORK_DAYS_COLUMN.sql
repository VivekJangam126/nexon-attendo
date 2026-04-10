-- Add extra_work_days column to performance_metrics table
-- This tracks days worked on employee holidays (recurring offs, specific dates, public holidays)

ALTER TABLE performance_metrics
ADD COLUMN extra_work_days INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN performance_metrics.extra_work_days IS 'Number of days worked on holidays (recurring/specific/public) - these are shown separately and not counted in attendance_rate';
