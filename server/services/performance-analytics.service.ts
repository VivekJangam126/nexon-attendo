/**
 * Performance Analytics Service
 * Phase 1: Analytics Foundation
 * Handles performance metrics calculation, alerts, and analytics
 */

import { supabase } from '../supabase/client';

// Types
export interface PerformanceMetrics {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  total_working_days: number;
  days_present: number;
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
      // Use Promise.all to run queries in parallel for better performance
      const [workingDays, attendanceData, breakData] = await Promise.all([
        this.getWorkingDaysInMonth(employeeId, month, year),
        this.getAttendanceDataForMonth(employeeId, month, year),
        this.getBreakDataForMonth(employeeId, month, year)
      ]);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(workingDays, attendanceData, breakData);
      
      // Save or update metrics
      const { data, error } = await supabase
        .from('performance_metrics')
        .upsert({
          employee_id: employeeId,
          month,
          year,
          ...metrics,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,month,year'
        })
        .select()
        .single();

      if (error) throw error;

      // Check for alerts
      await this.checkAndCreateAlerts(employeeId, metrics, month, year);

      return { success: true, metrics: data };
    } catch (error) {
      console.error('Error calculating monthly metrics:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Get working days in a month for an employee (excluding holidays)
   */
  private async getWorkingDaysInMonth(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Get employee holidays for the month
    const { data: holidays } = await supabase
      .from('employee_recurring_holidays')
      .select('day_of_week')
      .eq('employee_id', employeeId);

    const { data: specificHolidays } = await supabase
      .from('employee_specific_holidays')
      .select('holiday_date')
      .eq('employee_id', employeeId)
      .gte('holiday_date', startDate.toISOString().split('T')[0])
      .lte('holiday_date', endDate.toISOString().split('T')[0]);

    let workingDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const isRecurringHoliday = holidays?.some(h => h.day_of_week === dayOfWeek);
      const isSpecificHoliday = specificHolidays?.some(h => 
        h.holiday_date === current.toISOString().split('T')[0]
      );
      
      if (!isRecurringHoliday && !isSpecificHoliday) {
        workingDays++;
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Get attendance data for a month
   */
  private async getAttendanceDataForMonth(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', employeeId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('start_date', startDate.toISOString().split('T')[0])
      .lte('end_date', endDate.toISOString().split('T')[0]);

    return { attendance: attendance || [], leaves: leaves || [] };
  }
  /**
   * Get break data for a month
   */
  private async getBreakDataForMonth(employeeId: string, month: number, year: number) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data: breaks, error } = await supabase
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
   * Calculate performance metrics from raw data
   */
  private calculateMetrics(workingDays: number, attendanceData: any, breakData: any[]) {
    const { attendance, leaves } = attendanceData;
    
    // Attendance metrics
    const daysPresent = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const daysAbsent = attendance.filter(a => a.status === 'absent').length;
    const daysOnLeave = leaves.length;
    const attendanceRate = workingDays > 0 ? (daysPresent / workingDays) * 100 : 0;

    // Punctuality metrics
    const onTimeAttendance = attendance.filter(a => a.status === 'present');
    const lateAttendance = attendance.filter(a => a.status === 'late');
    
    const onTimeDays = onTimeAttendance.length;
    const lateDays = lateAttendance.length;
    const avgLateMinutes = lateDays > 0 ? 
      lateAttendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0) / lateDays : 0;
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
      total_working_days: workingDays,
      days_present: daysPresent,
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
   * Check metrics against thresholds and create alerts
   */
  private async checkAndCreateAlerts(employeeId: string, metrics: any, month: number, year: number) {
    const { data: thresholds } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('is_active', true);

    if (!thresholds) return;

    for (const threshold of thresholds) {
      let metricValue: number;
      let alertType: string;
      let title: string;
      let message: string;

      switch (threshold.metric_type) {
        case 'breaks_per_day':
          metricValue = metrics.avg_breaks_per_day;
          alertType = 'excessive_breaks';
          title = 'Excessive Break Pattern';
          message = `Average breaks per day (${metricValue}) exceeds threshold`;
          break;
        case 'attendance_rate':
          metricValue = metrics.attendance_rate;
          alertType = 'low_attendance';
          title = 'Low Attendance Rate';
          message = `Attendance rate (${metricValue}%) below threshold`;
          break;
        case 'avg_late_minutes':
          metricValue = metrics.avg_late_minutes;
          alertType = 'late_pattern';
          title = 'Late Arrival Pattern';
          message = `Average late minutes (${metricValue}) exceeds threshold`;
          break;
        default:
          continue;
      }

      let severity: 'yellow' | 'red' | 'critical';
      if (metricValue >= threshold.critical_threshold) {
        severity = 'critical';
      } else if (metricValue >= threshold.red_threshold) {
        severity = 'red';
      } else if (metricValue >= threshold.yellow_threshold) {
        severity = 'yellow';
      } else {
        continue; // No alert needed
      }

      // Check if alert already exists for this period
      const { data: existingAlert } = await supabase
        .from('performance_alerts')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('alert_type', alertType)
        .eq('status', 'active')
        .gte('created_at', new Date(year, month - 1, 1).toISOString())
        .single();

      if (!existingAlert) {
        await supabase
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
            period_start: new Date(year, month - 1, 1).toISOString().split('T')[0],
            period_end: new Date(year, month, 0).toISOString().split('T')[0]
          });
      }
    }
  }
  /**
   * Calculate metrics for all employees in batches (more efficient)
   */
  async calculateAllEmployeesMetrics() {
    try {
      // Find the most recent month with actual attendance data
      const { data: recentAttendance } = await supabase
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
      const { data: employees, error: empError } = await supabase
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
            return { success: false, employee: employee.full_name, error: error.message };
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
      return { success: false, error: error.message };
    }
  }
  /**
   * Get all employees with their performance data (optimized for speed)
   */
  async getAllEmployeesPerformance() {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Single optimized query to get all employees with their metrics in one go
      const { data: employees, error: empError } = await supabase
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
      const { data: allMetrics } = await supabase
        .from('performance_metrics')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      // Get active alerts for all employees
      const { data: allAlerts } = await supabase
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
      return { success: false, error: error.message, employees: [] };
    }
  }

  /**
   * Get employee alerts
   */
  async getEmployeeAlerts(employeeId: string) {
    try {
      const { data: alerts, error } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, alerts: alerts || [] };
    } catch (error) {
      console.error('Error fetching employee alerts:', error);
      return { success: false, error: error.message, alerts: [] };
    }
  }
  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    try {
      const { data, error } = await supabase
        .from('performance_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, alert: data };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolutionNotes?: string) {
    try {
      const { data, error } = await supabase
        .from('performance_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, alert: data };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get alert thresholds
   */
  async getAlertThresholds() {
    try {
      const { data: thresholds, error } = await supabase
        .from('alert_thresholds')
        .select('*')
        .order('metric_type');

      if (error) throw error;

      return { success: true, thresholds: thresholds || [] };
    } catch (error) {
      console.error('Error fetching alert thresholds:', error);
      return { success: false, error: error.message, thresholds: [] };
    }
  }

  /**
   * Update alert threshold
   */
  async updateAlertThreshold(thresholdId: string, updates: Partial<AlertThreshold>) {
    try {
      const { data, error } = await supabase
        .from('alert_thresholds')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', thresholdId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, threshold: data };
    } catch (error) {
      console.error('Error updating alert threshold:', error);
      return { success: false, error: error.message };
    }
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();