/**
 * Performance Metrics Calculation API
 * Handles performance metrics calculation requests from frontend
 * Uses backend environment variables (service role key)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../server/types/database';

async function calculateMonthlyMetrics(
  supabaseAdmin: any,
  employeeId: string,
  month: number,
  year: number
) {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Fetch holiday config
    const [{ data: recurring }, { data: specific }, { data: publicHolidays }] = await Promise.all([
      supabaseAdmin
        .from('employee_recurring_holidays')
        .select('day_of_week')
        .eq('employee_id', employeeId),
      supabaseAdmin
        .from('employee_specific_holidays')
        .select('holiday_date')
        .eq('employee_id', employeeId)
        .gte('holiday_date', startDate)
        .lte('holiday_date', endDate),
      supabaseAdmin
        .from('master_public_holidays')
        .select('holiday_date')
        .eq('is_active', true)
        .gte('holiday_date', startDate)
        .lte('holiday_date', endDate)
    ]);

    let recurringDays: number[] = (recurring || []).map(h => h.day_of_week);
    if (recurringDays.length === 0) {
      recurringDays = [0, 6];
    }

    const specificDates = new Set((specific || []).map(h => h.holiday_date));
    const publicDates = new Set((publicHolidays || []).map(h => h.holiday_date));

    // Count working days
    const countWorkingDays = (start: Date, end: Date) => {
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        if (
          !recurringDays.includes(current.getDay()) &&
          !specificDates.has(dateStr) &&
          !publicDates.has(dateStr)
        ) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    const total_working_days = countWorkingDays(
      new Date(year, month - 1, 1),
      new Date(year, month, 0)
    );

    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    const elapsedEnd = isCurrentMonth ? today : new Date(year, month, 0);
    const working_days_till_today = countWorkingDays(
      new Date(year, month - 1, 1),
      elapsedEnd
    );

    // Fetch attendance
    const endStr = elapsedEnd.toISOString().split('T')[0];
    const [{ data: attendance }, { data: leaves }] = await Promise.all([
      supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('user_id', employeeId)
        .gte('date', startDate)
        .lte('date', endStr),
      supabaseAdmin
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
        .gte('start_date', startDate)
        .lte('end_date', endStr)
    ]);

    // Calculate metrics
    let daysPresent = (attendance || []).filter(a => a.status === 'present' || a.status === 'late').length;
    const daysAbsent = (attendance || []).filter(a => a.status === 'absent').length;
    const daysOnLeave = (leaves || []).length;

    let workOnHolidayDays = 0;
    workOnHolidayDays = (attendance || []).filter(a => {
      if (a.status !== 'present' && a.status !== 'late') return false;
      const dateStr = a.date;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      return (
        recurringDays.includes(dayOfWeek) ||
        specificDates.has(dateStr) ||
        publicDates.has(dateStr)
      );
    }).length;

    let attendanceRate = working_days_till_today > 0 ? (daysPresent / working_days_till_today) * 100 : 0;
    attendanceRate = Math.min(attendanceRate, 100);

    const onTimeAttendance = (attendance || []).filter(a => a.status === 'present');
    const lateAttendance = (attendance || []).filter(a => a.status === 'late');
    const onTimeDays = onTimeAttendance.length;
    const lateDays = lateAttendance.length;
    const avgLateMinutes = lateDays > 0 ? 
      lateAttendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0) / lateDays : 0;
    const punctualityScore = daysPresent > 0 ? (onTimeDays / daysPresent) * 100 : 0;

    let overallScore = 0;
    if (daysPresent > 0) {
      overallScore = (
        (attendanceRate * 0.4) +
        (punctualityScore * 0.3) +
        (Math.max(0, 100 - (0 * 10)) * 0.3)
      );
    }

    console.log('[PerformanceMetrics]', {
      employeeId,
      recurringHolidays: recurringDays,
      total_working_days,
      working_days_till_today,
      days_present: daysPresent,
      attendance_rate: attendanceRate
    });

    // Upsert metrics
    const { data, error } = await supabaseAdmin
      .from('performance_metrics')
      .upsert({
        employee_id: employeeId,
        month,
        year,
        total_working_days,
        working_days_till_today,
        days_present: daysPresent,
        days_absent: daysAbsent,
        days_on_leave: daysOnLeave,
        days_on_holiday: workOnHolidayDays,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        on_time_days: onTimeDays,
        late_days: lateDays,
        avg_late_minutes: Math.round(avgLateMinutes * 100) / 100,
        punctuality_score: Math.round(punctualityScore * 100) / 100,
        total_breaks: 0,
        avg_breaks_per_day: 0,
        total_break_minutes: 0,
        avg_break_duration: 0,
        overall_score: Math.round(overallScore * 100) / 100,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'employee_id,month,year'
      })
      .select()
      .single();

    if (error) throw error;

    // Check and create/resolve alerts based on fresh metrics
    await checkAndCreateAlerts(supabaseAdmin, employeeId, {
      attendance_rate: Math.round(attendanceRate * 100) / 100,
      avg_breaks_per_day: 0,
      avg_late_minutes: Math.round(avgLateMinutes * 100) / 100,
      punctuality_score: Math.round(punctualityScore * 100) / 100,
    }, month, year);

    return { success: true, metrics: data };
  } catch (error) {
    console.error('Error calculating monthly metrics:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function checkAndCreateAlerts(
  supabaseAdmin: any,
  employeeId: string,
  metrics: { attendance_rate: number; avg_breaks_per_day: number; avg_late_minutes: number; punctuality_score: number },
  month: number,
  year: number
) {
  const { data: thresholds } = await supabaseAdmin
    .from('alert_thresholds')
    .select('*')
    .eq('is_active', true);

  if (!thresholds) return;

  const periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const periodEnd   = new Date(year, month, 0).toISOString().split('T')[0];

  for (const threshold of thresholds) {
    let metricValue: number;
    let alertType: string;
    let title: string;
    let message: string;
    let lowerIsBad = false; // true = alert when value is LOW (e.g. attendance)

    switch (threshold.metric_type) {
      case 'breaks_per_day':
        metricValue = metrics.avg_breaks_per_day;
        alertType   = 'excessive_breaks';
        title       = 'Excessive Break Pattern';
        message     = `Average breaks per day (${metricValue.toFixed(1)}) exceeds threshold`;
        break;
      case 'attendance_rate':
        metricValue = metrics.attendance_rate;
        alertType   = 'low_attendance';
        title       = 'Low Attendance Rate';
        message     = `Attendance rate (${metricValue.toFixed(1)}%) is below threshold`;
        lowerIsBad  = true;
        break;
      case 'avg_late_minutes':
        metricValue = metrics.avg_late_minutes;
        alertType   = 'late_pattern';
        title       = 'Late Arrival Pattern';
        message     = `Average late minutes (${metricValue.toFixed(1)}) exceeds threshold`;
        break;
      default:
        continue;
    }

    // Determine severity based on metric direction
    let severity: 'yellow' | 'red' | 'critical' | null = null;
    if (lowerIsBad) {
      // attendance_rate: thresholds are minimums — alert when value drops BELOW them
      // Expected DB values: yellow=75, red=60, critical=50
      if (metricValue < threshold.critical_threshold) {
        severity = 'critical';
      } else if (metricValue < threshold.red_threshold) {
        severity = 'red';
      } else if (metricValue < threshold.yellow_threshold) {
        severity = 'yellow';
      }
    } else {
      // breaks/late minutes: alert when value goes ABOVE threshold
      if (metricValue >= threshold.critical_threshold) {
        severity = 'critical';
      } else if (metricValue >= threshold.red_threshold) {
        severity = 'red';
      } else if (metricValue >= threshold.yellow_threshold) {
        severity = 'yellow';
      }
    }

    // Find any existing active alert for this employee/type/month
    const { data: existingAlert } = await supabaseAdmin
      .from('performance_alerts')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('alert_type', alertType)
      .eq('status', 'active')
      .gte('created_at', new Date(year, month - 1, 1).toISOString())
      .maybeSingle();

    if (severity === null) {
      // Metric is healthy — auto-resolve any stale alert
      if (existingAlert) {
        await supabaseAdmin
          .from('performance_alerts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_notes: `Auto-resolved: metric improved to ${metricValue.toFixed(1)}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAlert.id);
      }
      continue;
    }

    // Create alert only if none exists for this period
    if (!existingAlert) {
      await supabaseAdmin
        .from('performance_alerts')
        .insert({
          employee_id: employeeId,
          alert_type: alertType,
          severity,
          title,
          message,
          metric_type: threshold.metric_type,
          metric_value: metricValue,
          threshold_value: threshold[`${severity}_threshold`],
          period_start: periodStart,
          period_end: periodEnd
        });
    }
  }
}

async function calculateAllEmployeesMetrics(supabaseAdmin: any) {
  try {
    const { data: recentAttendance } = await supabaseAdmin
      .from('attendance')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    let currentMonth: number;
    let currentYear: number;

    if (recentAttendance) {
      const recentDate = new Date(recentAttendance.date);
      currentMonth = recentDate.getMonth() + 1;
      currentYear = recentDate.getFullYear();
    } else {
      const currentDate = new Date();
      currentMonth = currentDate.getMonth() + 1;
      currentYear = currentDate.getFullYear();
    }

    const { data: employees, error: empError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'employee');

    if (empError) throw empError;

    let successCount = 0;
    let errorCount = 0;

    const batchSize = 10;
    for (let i = 0; i < (employees?.length || 0); i += batchSize) {
      const batch = employees?.slice(i, i + batchSize) || [];
      const batchPromises = batch.map(async (employee) => {
        try {
          await calculateMonthlyMetrics(supabaseAdmin, employee.id, currentMonth, currentYear);
          return { success: true, employee: employee.full_name };
        } catch (error) {
          return { success: false, employee: employee.full_name, error: error instanceof Error ? error.message : String(error) };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to calculate metrics for ${result.employee}:`, result.error);
        }
      });
    }

    return { 
      success: true, 
      message: `Calculated metrics for ${successCount} employees (${errorCount} errors)`,
      successCount,
      errorCount
    };
  } catch (error) {
    console.error('Error calculating all employee metrics:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Performance Calc API] Request received');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Performance Calc API] Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Supabase credentials not configured'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - missing auth token' });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const result = await calculateAllEmployeesMetrics(supabase);

    if (!result || typeof result !== 'object') {
      return res.status(500).json({ 
        error: 'Invalid calculation result'
      });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result);

  } catch (error) {
    console.error('[Performance Calc API] Error:', error);
    console.error('[Performance Calc API] Error stack:', error instanceof Error ? error.stack : 'N/A');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Failed to calculate metrics',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}
