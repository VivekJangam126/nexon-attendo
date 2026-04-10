# Force Recalculation of Performance Metrics

## Problem
- Old invalid alerts persisting from before new logic was implemented
- Some metrics showing invalid rates (100%+ or incorrect classifications)
- Need to clear everything and recalculate with new alert/metrics logic

## Solution: Full Recalculation Approach

This will:
1. ✅ Delete all metrics from current month
2. ✅ Delete all alerts from current month  
3. ✅ Recalculate everything fresh with NEW logic
4. ✅ Regenerate alerts based on updated thresholds

---

## **Option A: Use Backend Endpoint (Easiest)**

A new service method was added: `forceRecalculateCurrentMonth()`

### How to use:
1. Call the performance analytics API endpoint from your admin panel or manually:
```typescript
// In your controller/API route
import { performanceAnalyticsService } from '../services/performance-analytics.service';

const result = await performanceAnalyticsService.forceRecalculateCurrentMonth();
console.log(result);
// Returns: { success: true, message: "...", details: {...} }
```

2. Or curl the endpoint if available:
```bash
POST /api/performance/recalculate-month
```

Expected response:
```json
{
  "success": true,
  "message": "Full recalculation completed for 4/2026",
  "details": {
    "successCount": 12,
    "errorCount": 0,
    "message": "Calculated metrics for 12 employees (0 errors)"
  }
}
```

---

## **Option B: Use SQL Cleanup Script (Manual)**

Found in: `RECALCULATE_PERFORMANCE_METRICS.sql`

### Steps:
1. Open Supabase SQL Editor
2. Copy-paste the SQL script content
3. Run it to delete old data
4. Then manually trigger recalculation or wait for next scheduled run

This deletes:
- All alerts from current month
- All performance metrics from current month

### To verify deletion worked:
```sql
SELECT 
  (SELECT COUNT(*) FROM performance_metrics WHERE month = 4 AND year = 2026) as metrics_count,
  (SELECT COUNT(*) FROM performance_alerts WHERE created_at >= '2026-04-01') as alerts_count;
```

Both should return 0.

---

## **What Happens After Recalculation**

### New Metrics (Fixed):
- ✅ `days_present` = only working days (no 100%+ rates)
- ✅ `extra_work_days` = days worked on holidays (separated)
- ✅ `attendance_rate` ≤ 100% always

### New Alerts (Smart):
- ✅ **Low Attendance Alert**: Only if attendance < 75%
- ✅ **Late Arrival Alert**: Only if punctuality < 50%
- ✅ **Excessive Breaks Alert**: Based on configured thresholds

---

## **Recommended Steps**

1. **Run SQL Script First** (optional cleanup verification):
   ```sql
   -- Copy from RECALCULATE_PERFORMANCE_METRICS.sql
   ```

2. **Call the Recalculation Method**:
   ```
   POST /api/performance/recalculate-month
   ```

3. **Verify Results**:
   - Dashboard should show updated metrics
   - No 100%+ attendance rates
   - Alerts should only show for employees below thresholds

4. **Monitor Logs**:
   - Check console for `[RecalculateMetrics]` messages
   - Check `[PerformanceMetrics]` logs for individual employee results

---

## **What if there's an error?**

Common issues:
- **"Metrics deletion failed"** → Check DB permissions
- **"Recalculation failed"** → Check if attendance table has data
- **"High error count"** → Some employees might have incomplete data

Solution: Check server logs for `[RecalculateMetrics]` or `[PerformanceMetrics]` prefix

---

## **Timeline Going Forward**

- ✅ **Today**: Run full recalculation
- ✅ **Going forward**: New metrics/alerts calculated correctly each month
- ✅ **Dashboard**: Updated alerts show only relevant performance issues
