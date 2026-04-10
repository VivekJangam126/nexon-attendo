-- Cleanup and Recalculation Script for Performance Metrics
-- This script:
-- 1. Deletes all alerts from current month
-- 2. Deletes all performance metrics from current month
-- 3. Resets the system to allow fresh recalculation

-- Delete alerts from current month
DELETE FROM performance_alerts
WHERE created_at >= DATE_TRUNC('month', NOW())
  AND created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

-- Delete performance metrics from current month
DELETE FROM performance_metrics
WHERE month = EXTRACT(MONTH FROM NOW())::int
  AND year = EXTRACT(YEAR FROM NOW())::int;

-- Verification query - run this to confirm deletion
-- SELECT 
--   (SELECT COUNT(*) FROM performance_metrics WHERE month = EXTRACT(MONTH FROM NOW())::int AND year = EXTRACT(YEAR FROM NOW())::int) as metrics_count,
--   (SELECT COUNT(*) FROM performance_alerts WHERE created_at >= DATE_TRUNC('month', NOW())) as alerts_count;
