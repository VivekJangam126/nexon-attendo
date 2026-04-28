/**
 * Performance Analytics Service (API Version)
 * Self-contained service for Vercel serverless environment
 * Handles performance metrics calculation, alerts, and analytics
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../server/types/database';

// Create Supabase admin client - self-contained for Vercel
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in environment');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Types
export interface PerformanceMetrics {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  total_working_days: number;       // Full month — display only
  working_days_till_today: number;  // Elapsed days — used for rate calculation
  days_present: number;             // Days present on valid working days ONLY
  extra_work_days: number;          // Days worked on holidays (recurring/specific/public)
  days_absent: number;
  days_on_leave: number;
  days_on_holiday: number;
  attendance_rate: number;
  on_time_days: number;
  late_days: number;
  avg_late_minutes: number;
  punctuality_score: number;
  total_breaks: number;
  avg_breaks_per_day: number;
  total_break_minutes: number;
  avg_break_duration: number;
  overall_score: number;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceAlert {
  id: string;
  employee_id: string;
  alert_type: string;
  severity: 'yellow' | 'red' | 'critical';
  title: string;
  message: string;
  metric_type?: string;
  metric_value?: number;
  threshold_value?: number;
  period_start?: string;
  period_end?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeePerformanceCard {
  employee_id: string;
  employee_name: string;
  designation: string;
  role_type: string;
  status: string;
  current_month_metrics?: PerformanceMetrics;
  active_alerts: PerformanceAlert[];
  alert_count: number;
}

export interface AlertThreshold {
  id: string;
  metric_type: string;
  yellow_threshold: number;
  red_threshold: number;
  critical_threshold: number;
  description?: string;
  is_active: boolean;
}

class PerformanceAnalyticsService {
  /**
   * Calculate monthly performance metrics for an employee
   */
  async calculateMonthlyMetrics(employeeId: string, month: number, year: number) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Input validation
      if (!employeeId || typeof employeeId !== 'string') {
        throw new Error('Invalid employeeId');
      }
      if (month < 1 || month > 12 || !Number.isInteger(month)) {
        throw new Error('Invalid month: must be 1-12');
      }
      if (year < 2020 || year > 2100 || !Number.isInteger(year)) {
        throw new Error('Invalid year: must be between 2020-2100');
      }
      // Fetch holiday config once, share across both working-day calculations
      const holidayConfig = await this.getEmployeeHolidayConfig(employeeId, month, year);

      // STEP 2: Full month working days (for display / stored in DB)
      const total_working_days = this.countWorkingDays(
        new Date(year, month - 1, 1),
        new Date(year, month, 0),
        holidayConfig
      );

      // STEP 3: Working days till today (for rate calculation — never stored permanently as sole source)
      // Use UTC to ensure consistent timezone handling
      const today = new Date();
      const utcYear = today.getUTCFullYear();
      const utcMonth = today.getUTCMonth() + 1;
      const isCurrentMonth = utcMonth === month && utcYear === year;
      const elapsedEnd = isCurrentMonth ? today : new Date(Date.UTC(year, month, 0));
      const working_days_till_today = this.countWorkingDays(
        new Date(year, month - 1, 1),
        elapsedEnd,
        holidayConfig
      );

      // STEP 4: Attendance only up to today (not full month)
      const [attendanceData, breakData] = await Promise.all([
        this.getAttendanceDataForMonth(employeeId, month, year, elapsedEnd),
        this.getBreakDataForMonth(employeeId, month, year)
      ]);

      // STEP 5–7: Calculate metrics using correct denominators
      const metrics = this.calculateMetrics(
        employeeId,
        total_working_days,
        working_days_till_today,
        attendanceData,
        breakData,
        holidayConfig
      );

      // STEP 10: Validation
      if (metrics.days_present > working_days_till_today) {
        console.error(`[VALIDATION] days_present (${metrics.days_present}) > working_days_till_today (${working_days_till_today}) for employee ${employeeId}`);
      }
      if (working_days_till_today > total_working_days) {
        console.error(`[VALIDATION] working_days_till_today (${working_days_till_today}) > total_working_days (${total_working_days}) for employee ${employeeId}`);
      }
      if (metrics.attendance_rate > 100) {
        console.error(`[VALIDATION] attendance_rate (${metrics.attendance_rate}) > 100 for employee ${employeeId}`);
      }

      // STEP 11: Debug logging
      console.log('[PerformanceMetrics]', {
        employeeId,
        recurringHolidays: holidayConfig.recurringDays,
        specificHolidaysCount: holidayConfig.specificDates.size,
        total_working_days,
        working_days_till_today,
        days_present: metrics.days_present,
        extra_work_days: metrics.extra_work_days,
        attendance_rate: metrics.attendance_rate
      });

      // STEP 8: Upsert to DB
      const { data, error } = await supabaseAdmin
        .from('performance_metrics')
        .upsert({
          employee_id: employeeId,
          month,
          year,
          ...metrics,
          total_working_days,
          working_days_till_today,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,month,year'
        })
        .select()
        .single();

      if (error) throw error;

      await this.checkAndCreateAlerts(employeeId, metrics, month, year);

      return { success: true, metrics: data };
    } catch (error) {
      console.error('Error calculating monthly metrics:', error);
      // Return generic error message - don't expose internal details
      return { success: false, error: 'Failed to calculate metrics. Please try again.' };
    }
  }
  /**
   * STEP 1: Fetch all holiday config for an employee in a given month
   */
  private async getEmployeeHolidayConfig(employeeId: string, month: number, year: number) {
    const supabaseAdmin = getSupabaseAdmin();
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

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

    // STEP 12: Fallback if no recurring holidays configured
    let recurringDays: number[] = (recurring || []).map(h => h.day_of_week);
    if (recurringDays.length === 0) {
      recurringDays = [0, 6]; // Default: Sunday + Saturday
    }

    const specificDates = new Set<string>((specific || []).map((h: any) => h.holiday_date as string));
    const publicDates = new Set<string>((publicHolidays || []).map((h: any) => h.holiday_date as string));

    return { recurringDays, specificDates, publicDates };
  }

  /**
   * Count working days between startDate and endDate (inclusive) per employee config
   */
  private countWorkingDays(
    startDate: Date,
    endDate: Date,
    config: { recurringDays: number[]; specificDates: Set<string>; publicDates: Set<string> }
  ): number {
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      if (
        !config.recurringDays.includes(current.getDay()) &&
        !config.specificDates.has(dateStr) &&
        !config.publicDates.has(dateStr)
      ) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  /**
   * Check if a date is a holiday (recurring, specific, or public)
   */
  private isHoliday(
    dateStr: string,
    dayOfWeek: number,
    config: { recurringDays: number[]; specificDates: Set<string>; publicDates: Set<string> }
  ): boolean {
    return (
      config.recurringDays.includes(dayOfWeek) ||
      config.specificDates.has(dateStr) ||
      config.publicDates.has(dateStr)
    );
  }

  /**
   * STEP 4: Fetch attendance only up to today (not full month)
   */
  private async getAttendanceDataForMonth(
    employeeId: string,
    month: number,
    year: number,
    upToDate: Date
  ) {
    const supabaseAdmin = getSupabaseAdmin();
    const startStr = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endStr = upToDate.toISOString().split('T')[0];

    const [{ data: attendance }, { data: leaves }] = await Promise.all([
      supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('user_id', employeeId)
        .gte('date', startStr)
        .lte('date', endStr),
      supabaseAdmin
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
        .gte('start_date', startStr)
        .lte('end_date', endStr)
    ]);

    return { attendance: attendance || [], leaves: leaves || [] };
  }
  /**
   * Get break data for a month
   */
  private async getBreakDataForMonth(employeeId: string, month: number, year: number) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data: breaks, error } = await supabaseAdmin
        .from('break_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (error) {
        console.warn(`Break logs query failed for employee ${employeeId}:`, error.message);
        return [];
      }

      return breaks || [];
    } catch (error) {
      console.warn(`Break logs error for employee ${employeeId}:`, error.message);
      return [];
    }
  }

  /**
   * STEP 5–7: Calculate performance metrics from raw data
   * - total_working_days → display only
   * - working_days_till_today → used for attendance_rate
   * - Leave days do NOT reduce working_days_till_today
   * - Separate attendance on working days vs holidays
   */
  private calculateMetrics(
    employeeId: string,
    total_working_days: number,
    working_days_till_today: number,
    attendanceData: any,
    breakData: any[],
    holidayConfig: any
  ) {
    const { attendance, leaves } = attendanceData;

    // STEP 5: Separate attendance into working days vs holiday work
    let daysPresent = 0;           // Present on valid working days only
    let extraWorkDays = 0;         // Present on holidays (recurring/specific/public)
    const daysAbsent = attendance.filter(a => a.status === 'absent').length;
    const daysOnLeave = leaves.length;

    // Classify each attendance record
    for (const record of attendance) {
      if (record.status === 'present' || record.status === 'late') {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        const dayOfWeek = new Date(record.date).getDay();
        
        // Check if this day is a holiday
        const isHolidayDay = this.isHoliday(dateStr, dayOfWeek, holidayConfig);
        
        if (isHolidayDay) {
          extraWorkDays++;
        } else {
          daysPresent++;
        }
      }
    }

    // SAFETY CHECK: If days_present exceeds working_days_till_today, 
    // move excess days to extra_work_days (indicates classification issue)
    if (daysPresent > working_days_till_today) {
      const attendanceList = attendance.filter(a => a.status === 'present' || a.status === 'late');
      console.warn(
        `[PerformanceMetrics] Classification issue for employee ${employeeId}: ` +
        `days_present (${daysPresent}) exceeds working_days_till_today (${working_days_till_today}). ` +
        `Moving ${daysPresent - working_days_till_today} days to extra_work_days. ` +
        `Holiday config: recurring=${JSON.stringify(holidayConfig.recurringDays)}, ` +
        `specific=${holidayConfig.specificDates.size}, public=${holidayConfig.publicDates.size}. ` +
        `Attendance records:`,
        attendanceList.map(a => ({ date: a.date, status: a.status }))
      );
      extraWorkDays += (daysPresent - working_days_till_today);
      daysPresent = working_days_till_today;
    }

    // STEP 7: attendance_rate = days_present / working_days_till_today (NEVER total_working_days)
    // NOTE: This uses ONLY working days, excludes extra_work_days
    const attendanceRate = working_days_till_today > 0 ? (daysPresent / working_days_till_today) * 100 : 0;

    // Punctuality metrics - ONLY for working days (not holidays)
    let onTimeDays = 0;
    let lateDays = 0;
    const lateMinutesArray: number[] = [];
    
    for (const record of attendance) {
      if (record.status === 'present' || record.status === 'late') {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        const dayOfWeek = new Date(record.date).getDay();
        const isHolidayDay = this.isHoliday(dateStr, dayOfWeek, holidayConfig);
        
        // Only count punctuality for working days
        if (!isHolidayDay) {
          if (record.status === 'present') {
            onTimeDays++;
          } else if (record.status === 'late') {
            lateDays++;
            lateMinutesArray.push(record.late_minutes || 0);
          }
        }
      }
    }
    
    const lateAttendance = lateMinutesArray;
    const avgLateMinutes = lateDays > 0 ? 
      lateAttendance.reduce((sum, mins) => sum + mins, 0) / lateDays : 0;
    const punctualityScore = daysPresent > 0 ? (onTimeDays / daysPresent) * 100 : 0;

    // Break metrics
    const totalBreaks = breakData.length;
    const avgBreaksPerDay = daysPresent > 0 ? totalBreaks / daysPresent : 0;
    const totalBreakMinutes = breakData.reduce((sum, b) => {
      if (b.start_time && b.end_time) {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        return sum + ((end.getTime() - start.getTime()) / (1000 * 60));
      }
      return sum;
    }, 0);
    const avgBreakDuration = totalBreaks > 0 ? totalBreakMinutes / totalBreaks : 0;

    // Overall score calculation (weighted average)
    // If no attendance data, return 0 instead of 30
    let overallScore = 0;
    if (daysPresent > 0) {
      overallScore = (
        (attendanceRate * 0.4) +
        (punctualityScore * 0.3) +
        (Math.max(0, 100 - (avgBreaksPerDay * 10)) * 0.3)
      );
    }

    return {
      // total_working_days and working_days_till_today are set by the caller
      days_present: daysPresent,
      extra_work_days: extraWorkDays,
      days_absent: daysAbsent,
      days_on_leave: daysOnLeave,
      days_on_holiday: 0, // Will be calculated separately
      attendance_rate: Math.round(attendanceRate * 100) / 100,
      on_time_days: onTimeDays,
      late_days: lateDays,
      avg_late_minutes: Math.round(avgLateMinutes * 100) / 100,
      punctuality_score: Math.round(punctualityScore * 100) / 100,
      total_breaks: totalBreaks,
      avg_breaks_per_day: Math.round(avgBreaksPerDay * 100) / 100,
      total_break_minutes: Math.round(totalBreakMinutes),
      avg_break_duration: Math.round(avgBreakDuration * 100) / 100,
      overall_score: Math.round(overallScore * 100) / 100
    };
  }
  /**
   * Check metrics against thresholds and create/resolve alerts
   *
   * Metric direction:
   *  - "higher is worse" (breaks_per_day, avg_late_minutes): alert when value >= threshold
   *  - "lower is worse" (attendance_rate): alert when value < threshold (inverted)
   */
  private async checkAndCreateAlerts(employeeId: string, metrics: any, month: number, year: number) {
    const supabaseAdmin = getSupabaseAdmin();
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
      // "lowerIsBad" metrics fire when the value DROPS below a threshold
      let lowerIsBad = false;

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
          lowerIsBad  = true;   // alert when attendance is LOW
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

      // Determine severity
      let severity: 'yellow' | 'red' | 'critical' | null = null;

      if (lowerIsBad) {
        // For attendance_rate: thresholds represent the MINIMUM acceptable value.
        // critical_threshold < red_threshold < yellow_threshold (e.g. 50 < 60 < 75)
        if (metricValue < threshold.critical_threshold) {
          severity = 'critical';
        } else if (metricValue < threshold.red_threshold) {
          severity = 'red';
        } else if (metricValue < threshold.yellow_threshold) {
          severity = 'yellow';
        }
      } else {
        // For breaks/late minutes: higher value = worse
        if (metricValue >= threshold.critical_threshold) {
          severity = 'critical';
        } else if (metricValue >= threshold.red_threshold) {
          severity = 'red';
        } else if (metricValue >= threshold.yellow_threshold) {
          severity = 'yellow';
        }
      }

      // Fetch any existing active alert for this employee + type in this month
      const { data: existingAlert } = await supabaseAdmin
        .from('performance_alerts')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('alert_type', alertType)
        .eq('status', 'active')
        .gte('created_at', new Date(year, month - 1, 1).toISOString())
        .maybeSingle();

      if (severity === null) {
        // Metric is now healthy — resolve any stale alert for this period
        if (existingAlert) {
          await supabaseAdmin
            .from('performance_alerts')
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              resolution_notes: `Auto-resolved: metric improved to ${metricValue.toFixed(1)}`,
              updated_at: new Date().toISOString()
            } as any)
            .eq('id', existingAlert.id);
        }
        continue;
      }

      // Create alert only if one doesn't already exist for this period
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
  /**
   * Force full recalculation for current month
   * Deletes old metrics and alerts, then recalculates everything
   * NOTE: Should only be called by admin, add authorization check in controller
   */
  async forceRecalculateCurrentMonth(adminUserId?: string) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      // Security: Verify admin authorization (implement in controller)
      if (!adminUserId) {
        console.warn('[RecalculateMetrics] Recalculation triggered without admin context');
      }
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      console.log(`[RecalculateMetrics] Starting full recalculation for ${currentMonth}/${currentYear}`);

      // Step 1: Delete old alerts from current month
      const { error: alertError } = await supabaseAdmin
        .from('performance_alerts')
        .delete()
        .gte('created_at', new Date(currentYear, currentMonth - 1, 1).toISOString())
        .lt('created_at', new Date(currentYear, currentMonth, 1).toISOString());

      if (alertError) {
        console.error('[RecalculateMetrics] Failed to delete alerts:', alertError);
        return { success: false, error: `Alert deletion failed: ${alertError.message}` };
      }

      // Step 2: Delete old metrics from current month
      const { error: metricsError } = await supabaseAdmin
        .from('performance_metrics')
        .delete()
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (metricsError) {
        console.error('[RecalculateMetrics] Failed to delete metrics:', metricsError);
        return { success: false, error: `Metrics deletion failed: ${metricsError.message}` };
      }

      console.log('[RecalculateMetrics] Cleanup completed. Starting fresh recalculation...');

      // Step 3: Recalculate all employee metrics with fresh data
      const recalcResult = await this.calculateAllEmployeesMetrics();

      console.log('[RecalculateMetrics] Full recalculation completed:', recalcResult);

      return {
        success: true,
        message: `Full recalculation completed for ${currentMonth}/${currentYear}`,
        details: recalcResult
      };
    } catch (error) {
      console.error('[RecalculateMetrics] Force recalculation error:', error);
      return { success: false, error: 'Recalculation failed. Please check logs.' };
    }
  }

  /**
   * Calculate metrics for all employees in batches (more efficient)
   */
  async calculateAllEmployeesMetrics() {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Find the most recent month with actual attendance data
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

      // Get all employees
      const { data: employees, error: empError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee');

      if (empError) throw empError;

      let successCount = 0;
      let errorCount = 0;

      // Process employees in smaller batches to avoid overwhelming the database
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < (employees?.length || 0); i += batchSize) {
        batches.push(employees?.slice(i, i + batchSize) || []);
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (employee) => {
          try {
            await this.calculateMonthlyMetrics(employee.id, currentMonth, currentYear);
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
      return { success: false, error: 'Batch calculation failed. Please try again.' };
    }
  }
  /**
   * Get all employees with their performance data (optimized for speed)
   */
  async getAllEmployeesPerformance() {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Single optimized query to get all employees with their metrics in one go
      const { data: employees, error: empError } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          full_name,
          designation,
          role_type,
          status,
          role
        `)
        .eq('role', 'employee');

      if (empError) throw empError;

      // Get all metrics for current month in a single query
      const employeeIds = employees?.map(emp => emp.id) || [];
      const { data: allMetrics } = await supabaseAdmin
        .from('performance_metrics')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      // Get active alerts for all employees
      const { data: allAlerts } = await supabaseAdmin
        .from('performance_alerts')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Create lookup maps for O(1) access
      const metricsMap = new Map();
      const alertsMap = new Map();
      
      allMetrics?.forEach(metric => {
        metricsMap.set(metric.employee_id, metric);
      });
      
      allAlerts?.forEach(alert => {
        if (!alertsMap.has(alert.employee_id)) {
          alertsMap.set(alert.employee_id, []);
        }
        alertsMap.get(alert.employee_id).push(alert);
      });

      // Build employee cards efficiently
      const employeeCards: EmployeePerformanceCard[] = (employees || []).map(emp => {
        const employeeAlerts = alertsMap.get(emp.id) || [];
        return {
          employee_id: emp.id,
          employee_name: emp.full_name,
          designation: emp.designation || 'Employee',
          role_type: emp.role_type || 'Employee',
          status: emp.status,
          current_month_metrics: metricsMap.get(emp.id) || null,
          active_alerts: employeeAlerts,
          alert_count: employeeAlerts.length
        };
      });

      return { success: true, employees: employeeCards };
    } catch (error) {
      console.error('Error fetching employee performance:', error);
      return { success: false, error: 'Failed to fetch performance data', employees: [] };
    }
  }

  /**
   * Get employee alerts
   */
  async getEmployeeAlerts(employeeId: string) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: alerts, error } = await supabaseAdmin
        .from('performance_alerts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, alerts: alerts || [] };
    } catch (error) {
      console.error('Error fetching employee alerts:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error), alerts: [] };
    }
  }
  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('performance_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, alert: data };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolutionNotes?: string) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('performance_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, alert: data };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get alert thresholds
   */
  async getAlertThresholds() {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: thresholds, error } = await supabaseAdmin
        .from('alert_thresholds')
        .select('*')
        .order('metric_type');

      if (error) throw error;

      return { success: true, thresholds: thresholds || [] };
    } catch (error) {
      console.error('Error fetching alert thresholds:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error), thresholds: [] };
    }
  }

  /**
   * Update alert threshold
   */
  async updateAlertThreshold(thresholdId: string, updates: Partial<AlertThreshold>) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('alert_thresholds')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', thresholdId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, threshold: data };
    } catch (error) {
      console.error('Error updating alert threshold:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();
