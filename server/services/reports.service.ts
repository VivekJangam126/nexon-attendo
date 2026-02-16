/**
 * Reports Service
 * Handles attendance reports and analytics
 */

import { supabase } from '../supabase/client';

export interface ReportStats {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
  comparedToPrevious: number;
}

export interface DailyBreakdown {
  day: string;
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface EmployeeAttendanceRecord {
  employeeName: string;
  email: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: 'present' | 'late' | 'absent';
}

export const reportsService = {
  /**
   * Get attendance statistics for a time range
   */
  async getAttendanceStats(
    timeRange: 'today' | 'week' | 'month'
  ): Promise<{ stats: ReportStats; error: Error | null }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let startDate: string;
      let endDate: string;
      let previousStartDate: string;
      let previousEndDate: string;

      // Calculate date ranges with proper boundaries
      if (timeRange === 'today') {
        // Today only
        startDate = todayStr;
        endDate = todayStr;
        
        // Yesterday for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        previousStartDate = yesterday.toISOString().split('T')[0];
        previousEndDate = previousStartDate;
      } else if (timeRange === 'week') {
        // Last 7 days (today - 6 days to today)
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 6);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = todayStr;
        
        // Previous 7 days (today - 13 days to today - 7 days)
        const prevWeekStart = new Date(today);
        prevWeekStart.setDate(prevWeekStart.getDate() - 13);
        const prevWeekEnd = new Date(today);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
        previousStartDate = prevWeekStart.toISOString().split('T')[0];
        previousEndDate = prevWeekEnd.toISOString().split('T')[0];
      } else {
        // Last 30 days (today - 29 days to today)
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 29);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = todayStr;
        
        // Previous 30 days (today - 59 days to today - 30 days)
        const prevMonthStart = new Date(today);
        prevMonthStart.setDate(prevMonthStart.getDate() - 59);
        const prevMonthEnd = new Date(today);
        prevMonthEnd.setDate(prevMonthEnd.getDate() - 30);
        previousStartDate = prevMonthStart.toISOString().split('T')[0];
        previousEndDate = prevMonthEnd.toISOString().split('T')[0];
      }

      // Get total active employees
      const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('role', 'employee');

      // Get attendance window settings for status recalculation
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      // Get current period attendance with check_in_time for recalculation
      const { data: currentData } = await supabase
        .from('attendance')
        .select('status, check_in_time')
        .gte('date', startDate)
        .lte('date', endDate);

      // Get previous period attendance
      const { data: previousData } = await supabase
        .from('attendance')
        .select('status, check_in_time')
        .gte('date', previousStartDate)
        .lte('date', previousEndDate);

      // RECALCULATE status for current period to fix incorrect database records
      let present = 0;
      let late = 0;
      
      currentData?.forEach((record: any) => {
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          // Recalculate correct status
          if (checkInMinutes <= gracePeriodEndMinutes) {
            present++;
          } else {
            late++;
          }
        } else {
          // If no check-in time or window data, use database status
          if (record.status === 'present') present++;
          else if (record.status === 'late') late++;
        }
      });

      // RECALCULATE status for previous period
      let previousPresent = 0;
      let previousLate = 0;
      
      previousData?.forEach((record: any) => {
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          // Recalculate correct status
          if (checkInMinutes <= gracePeriodEndMinutes) {
            previousPresent++;
          } else {
            previousLate++;
          }
        } else {
          // If no check-in time or window data, use database status
          if (record.status === 'present') previousPresent++;
          else if (record.status === 'late') previousLate++;
        }
      });
      
      // Calculate absent as: total employees - (present + late)
      // This accounts for employees who didn't check in at all
      const absent = (totalEmployees || 0) - (present + late);

      // Calculate attendance rate based on total employees, not attendance records
      // Rate = (present + late) / totalEmployees * 100
      const currentRate = totalEmployees && totalEmployees > 0
        ? ((present + late) / totalEmployees) * 100
        : 0;

      const previousRate = totalEmployees && totalEmployees > 0
        ? ((previousPresent + previousLate) / totalEmployees) * 100
        : 0;

      const comparedToPrevious = currentRate - previousRate;

      return {
        stats: {
          totalEmployees: totalEmployees || 0,
          present,
          late,
          absent: Math.max(0, absent), // Ensure non-negative
          attendanceRate: Math.round(currentRate * 10) / 10,
          comparedToPrevious: Math.round(comparedToPrevious * 10) / 10,
        },
        error: null,
      };
    } catch (err) {
      return {
        stats: {
          totalEmployees: 0,
          present: 0,
          late: 0,
          absent: 0,
          attendanceRate: 0,
          comparedToPrevious: 0,
        },
        error: err instanceof Error ? err : new Error('Failed to fetch report stats'),
      };
    }
  },

  /**
   * Get daily breakdown for the week
   */
  async getWeeklyBreakdown(): Promise<{ breakdown: DailyBreakdown[]; error: Error | null }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get last 7 days (today - 6 days to today)
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      const startDate = weekStart.toISOString().split('T')[0];

      // Get total active employees
      const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('role', 'employee');

      const totalEmp = totalEmployees || 0;

      // Get attendance window settings for status recalculation
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      // Get attendance data with check_in_time for recalculation
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status, check_in_time')
        .gte('date', startDate)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      // Group by date with recalculated status
      const dateMap = new Map<string, { present: number; late: number }>();
      
      attendanceData?.forEach((record: any) => {
        if (!dateMap.has(record.date)) {
          dateMap.set(record.date, { present: 0, late: 0 });
        }
        const stats = dateMap.get(record.date)!;
        
        // RECALCULATE status based on check-in time
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          // Recalculate correct status
          if (checkInMinutes <= gracePeriodEndMinutes) {
            stats.present++;
          } else {
            stats.late++;
          }
        } else {
          // If no check-in time or window data, use database status
          if (record.status === 'present') stats.present++;
          else if (record.status === 'late') stats.late++;
        }
      });

      // Generate all 7 days (even if no attendance records)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const breakdown: DailyBreakdown[] = last7Days.map(date => {
        const stats = dateMap.get(date) || { present: 0, late: 0 };
        const present = stats.present;
        const late = stats.late;
        // Absent = total employees - (present + late)
        const absent = totalEmp - (present + late);
        
        const dateObj = new Date(date + 'T00:00:00');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        return {
          day: dayNames[dateObj.getDay()],
          date,
          present,
          late,
          absent: Math.max(0, absent), // Ensure non-negative
        };
      });

      return { breakdown, error: null };
    } catch (err) {
      return {
        breakdown: [],
        error: err instanceof Error ? err : new Error('Failed to fetch weekly breakdown'),
      };
    }
  },

  /**
   * Get detailed breakdown for any time range (for CSV export)
   */
  async getDetailedBreakdown(
    timeRange: 'today' | 'week' | 'month'
  ): Promise<{ breakdown: DailyBreakdown[]; error: Error | null }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let startDate: string;
      let numDays: number;

      if (timeRange === 'today') {
        startDate = todayStr;
        numDays = 1;
      } else if (timeRange === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 6);
        startDate = weekStart.toISOString().split('T')[0];
        numDays = 7;
      } else {
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 29);
        startDate = monthStart.toISOString().split('T')[0];
        numDays = 30;
      }

      // Get total active employees
      const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('role', 'employee');

      const totalEmp = totalEmployees || 0;

      // Get attendance window settings for status recalculation
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      // Get attendance data with check_in_time for recalculation
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status, check_in_time')
        .gte('date', startDate)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      // Group by date with recalculated status
      const dateMap = new Map<string, { present: number; late: number }>();
      
      attendanceData?.forEach((record: any) => {
        if (!dateMap.has(record.date)) {
          dateMap.set(record.date, { present: 0, late: 0 });
        }
        const stats = dateMap.get(record.date)!;
        
        // RECALCULATE status based on check-in time
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          // Recalculate correct status
          if (checkInMinutes <= gracePeriodEndMinutes) {
            stats.present++;
          } else {
            stats.late++;
          }
        } else {
          // If no check-in time or window data, use database status
          if (record.status === 'present') stats.present++;
          else if (record.status === 'late') stats.late++;
        }
      });

      // Generate all days in range
      const allDays = Array.from({ length: numDays }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (numDays - 1 - i));
        return date.toISOString().split('T')[0];
      });

      const breakdown: DailyBreakdown[] = allDays.map(date => {
        const stats = dateMap.get(date) || { present: 0, late: 0 };
        const present = stats.present;
        const late = stats.late;
        const absent = totalEmp - (present + late);
        
        const dateObj = new Date(date + 'T00:00:00');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        return {
          day: dayNames[dateObj.getDay()],
          date,
          present,
          late,
          absent: Math.max(0, absent),
        };
      });

      return { breakdown, error: null };
    } catch (err) {
      return {
        breakdown: [],
        error: err instanceof Error ? err : new Error('Failed to fetch detailed breakdown'),
      };
    }
  },

  /**
   * Get employee attendance records with timestamps for export
   * Includes ALL employees with their status (Present, Late, Absent, Not Marked)
   */
  async getEmployeeAttendanceRecords(
    timeRange: 'today' | 'week' | 'month'
  ): Promise<{ records: EmployeeAttendanceRecord[]; error: Error | null }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let startDate: string;

      if (timeRange === 'today') {
        startDate = todayStr;
      } else if (timeRange === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 6);
        startDate = weekStart.toISOString().split('T')[0];
      } else {
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 29);
        startDate = monthStart.toISOString().split('T')[0];
      }

      // Get ALL active employees
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('status', 'active')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (employeesError) throw employeesError;

      // Get attendance records for the date range
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          date,
          check_in_time,
          check_out_time,
          status,
          user_id
        `)
        .gte('date', startDate)
        .lte('date', todayStr);

      if (attendanceError) throw attendanceError;

      // Get attendance window settings for status recalculation
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      // Create a map of attendance records by user_id and date
      const attendanceMap = new Map<string, any>();
      attendanceData?.forEach((record: any) => {
        const key = `${record.user_id}_${record.date}`;
        
        // RECALCULATE status based on check-in time to fix any incorrect database records
        let correctedStatus = record.status;
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          // Recalculate correct status
          correctedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        }
        
        attendanceMap.set(key, { ...record, status: correctedStatus });
      });

      // Generate all dates in the range
      const numDays = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
      const allDates = Array.from({ length: numDays }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (numDays - 1 - i));
        return date.toISOString().split('T')[0];
      });

      // Create records for ALL employees for ALL dates
      const records: EmployeeAttendanceRecord[] = [];
      
      employees?.forEach((employee: any) => {
        allDates.forEach((date) => {
          const key = `${employee.id}_${date}`;
          const attendance = attendanceMap.get(key);

          if (attendance) {
            // Employee has attendance record
            const checkInDate = new Date(attendance.check_in_time);
            const checkInFormatted = checkInDate.toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata'
            });

            let checkOutFormatted = null;
            if (attendance.check_out_time) {
              const checkOutDate = new Date(attendance.check_out_time);
              checkOutFormatted = checkOutDate.toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
              });
            }

            records.push({
              employeeName: employee.full_name,
              email: employee.email,
              date: date,
              checkInTime: checkInFormatted,
              checkOutTime: checkOutFormatted,
              status: attendance.status,
            });
          } else {
            // Employee has no attendance record - mark as absent
            records.push({
              employeeName: employee.full_name,
              email: employee.email,
              date: date,
              checkInTime: '-',
              checkOutTime: null,
              status: 'absent',
            });
          }
        });
      });

      // Sort by date (descending) then by name
      records.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });

      return { records, error: null };
    } catch (err) {
      return {
        records: [],
        error: err instanceof Error ? err : new Error('Failed to fetch employee attendance records'),
      };
    }
  },
};
