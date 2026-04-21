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
  shift_type?: string;
  shift_mode?: string;
  shift_config?: any;
}

export interface AttendanceHistoryRecord {
  userId: string;
  employeeName: string;
  email: string;
  dates: { [date: string]: 'present' | 'late' | 'absent' | null };
}

export interface AttendanceHistoryFilters {
  startDate?: string;
  endDate?: string;
  employeeIds?: string[];
  status?: ('present' | 'late' | 'absent')[];
  searchQuery?: string;
  officeIds?: string[];
}

export interface EmployeeDetailedHistory {
  userId: string;
  employeeName: string;
  email: string;
  officeLocation: string;
  records: {
    date: string;
    status: 'present' | 'late' | 'absent';
    checkInTime: string | null;
    checkOutTime: string | null;
    officeName: string | null;
  }[];
  stats: {
    totalDays: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
  };
}

export const reportsService = {
  /**
   * Get attendance history with flexible date ranges and filters
   */
  async getAttendanceHistory(
    filters: AttendanceHistoryFilters
  ): Promise<{ records: AttendanceHistoryRecord[]; error: Error | null }> {
    try {
      const { startDate, endDate, employeeIds, status, searchQuery } = filters;

      // Build employee query
      let employeeQuery = supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('status', 'active')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      // Apply employee filters
      if (employeeIds && employeeIds.length > 0) {
        employeeQuery = employeeQuery.in('id', employeeIds);
      }

      if (searchQuery) {
        employeeQuery = employeeQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: employees, error: employeesError } = await employeeQuery;
      if (employeesError) throw employeesError;

      // Build attendance query
      let attendanceQuery = supabase
        .from('attendance')
        .select('user_id, date, status, check_in_time');

      if (startDate) {
        attendanceQuery = attendanceQuery.gte('date', startDate);
      }
      if (endDate) {
        attendanceQuery = attendanceQuery.lte('date', endDate);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      // Get attendance window settings for status recalculation
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      // Create attendance map with recalculated status
      const attendanceMap = new Map<string, 'present' | 'late' | 'absent'>();
      attendanceData?.forEach((record: any) => {
        const key = `${record.user_id}_${record.date}`;
        
        // Recalculate status based on check-in time
        let correctedStatus = record.status;
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          correctedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        }
        
        attendanceMap.set(key, correctedStatus);
      });

      // Generate date range
      const dates: string[] = [];
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
      }

      // Build records
      const records: AttendanceHistoryRecord[] = employees?.map((employee: any) => {
        const dateMap: { [date: string]: 'present' | 'late' | 'absent' | null } = {};
        
        dates.forEach(date => {
          const key = `${employee.id}_${date}`;
          const attendanceStatus = attendanceMap.get(key);
          dateMap[date] = attendanceStatus || 'absent';
        });

        return {
          userId: employee.id,
          employeeName: employee.full_name,
          email: employee.email,
          dates: dateMap,
        };
      }) || [];

      // Apply status filter
      let filteredRecords = records;
      if (status && status.length > 0) {
        filteredRecords = records.filter(record => {
          return Object.values(record.dates).some(s => s && status.includes(s));
        });
      }

      return { records: filteredRecords, error: null };
    } catch (err) {
      return {
        records: [],
        error: err instanceof Error ? err : new Error('Failed to fetch attendance history'),
      };
    }
  },

  /**
   * Get attendance statistics for a time range
   * OPTIMIZED VERSION - Uses parallel queries for better performance
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
      let daysInRange: number;

      // Calculate date ranges with proper boundaries
      if (timeRange === 'today') {
        startDate = todayStr;
        endDate = todayStr;
        daysInRange = 1;
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        previousStartDate = yesterday.toISOString().split('T')[0];
        previousEndDate = previousStartDate;
      } else if (timeRange === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 6);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = todayStr;
        daysInRange = 7;
        
        const prevWeekStart = new Date(today);
        prevWeekStart.setDate(prevWeekStart.getDate() - 13);
        const prevWeekEnd = new Date(today);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
        previousStartDate = prevWeekStart.toISOString().split('T')[0];
        previousEndDate = prevWeekEnd.toISOString().split('T')[0];
      } else {
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 29);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = todayStr;
        daysInRange = 30;
        
        const prevMonthStart = new Date(today);
        prevMonthStart.setDate(prevMonthStart.getDate() - 59);
        const prevMonthEnd = new Date(today);
        prevMonthEnd.setDate(prevMonthEnd.getDate() - 30);
        previousStartDate = prevMonthStart.toISOString().split('T')[0];
        previousEndDate = prevMonthEnd.toISOString().split('T')[0];
      }

      // OPTIMIZED: Execute all queries in parallel
      const [employeeCountResult, windowResult, currentDataResult, previousDataResult] = await Promise.all([
        // Get total active employees
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('role', 'employee'),
        
        // Get attendance window settings
        supabase
          .from('attendance_settings')
          .select('start_time, grace_period_minutes')
          .eq('setting_name', 'default_attendance_window')
          .eq('is_active', true)
          .maybeSingle(),
        
        // Get current period attendance
        supabase
          .from('attendance')
          .select('status, check_in_time, date')
          .gte('date', startDate)
          .lte('date', endDate),
        
        // Get previous period attendance
        supabase
          .from('attendance')
          .select('status, check_in_time, date')
          .gte('date', previousStartDate)
          .lte('date', previousEndDate)
      ]);

      const totalEmployees = employeeCountResult.count || 0;
      const windowData = windowResult.data;
      const currentData = currentDataResult.data || [];
      const previousData = previousDataResult.data || [];

      // Count unique dates with actual attendance data
      const uniqueDatesWithData = new Set(currentData.map((r: any) => r.date)).size;
      const previousUniqueDates = new Set(previousData.map((r: any) => r.date)).size;

      // RECALCULATE status for current period
      let present = 0;
      let late = 0;
      
      currentData.forEach((record: any) => {
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          if (checkInMinutes <= gracePeriodEndMinutes) {
            present++;
          } else {
            late++;
          }
        } else {
          if (record.status === 'present') present++;
          else if (record.status === 'late') late++;
        }
      });

      // RECALCULATE status for previous period
      let previousPresent = 0;
      let previousLate = 0;
      
      previousData.forEach((record: any) => {
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          if (checkInMinutes <= gracePeriodEndMinutes) {
            previousPresent++;
          } else {
            previousLate++;
          }
        } else {
          if (record.status === 'present') previousPresent++;
          else if (record.status === 'late') previousLate++;
        }
      });
      
      // Calculate based on actual days with data
      const actualDaysWithData = uniqueDatesWithData > 0 ? uniqueDatesWithData : daysInRange;
      const totalPossibleAttendance = totalEmployees * actualDaysWithData;
      const absent = totalPossibleAttendance - (present + late);

      const currentRate = totalPossibleAttendance > 0
        ? ((present + late) / totalPossibleAttendance) * 100
        : 0;

      const previousActualDays = previousUniqueDates > 0 ? previousUniqueDates : daysInRange;
      const previousTotalPossible = totalEmployees * previousActualDays;
      const previousRate = previousTotalPossible > 0
        ? ((previousPresent + previousLate) / previousTotalPossible) * 100
        : 0;

      const comparedToPrevious = currentRate - previousRate;

      return {
        stats: {
          totalEmployees,
          present,
          late,
          absent: Math.max(0, absent),
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
   * OPTIMIZED VERSION - Uses parallel queries and efficient processing
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

      // OPTIMIZED: Execute queries in parallel
      const [employeeCountResult, windowResult, attendanceResult] = await Promise.all([
        // Get total active employees count
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('role', 'employee'),
        
        // Get attendance window settings
        supabase
          .from('attendance_settings')
          .select('start_time, grace_period_minutes')
          .eq('setting_name', 'default_attendance_window')
          .eq('is_active', true)
          .maybeSingle(),
        
        // Get attendance data
        supabase
          .from('attendance')
          .select('date, status, check_in_time')
          .gte('date', startDate)
          .lte('date', todayStr)
          .order('date', { ascending: true })
      ]);

      const totalEmp = employeeCountResult.count || 0;
      const windowData = windowResult.data;
      const attendanceData = attendanceResult.data || [];

      // Group by date with recalculated status
      const dateMap = new Map<string, { present: number; late: number }>();
      
      attendanceData.forEach((record: any) => {
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
   * Get detailed attendance history for a specific employee
   */
  async getEmployeeDetailedHistory(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ employee: EmployeeDetailedHistory | null; error: Error | null }> {
    try {
      // Get employee profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, office_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Employee not found');

      // Get office name if office_id exists
      let officeName = 'Not assigned';
      if ((profile as any).office_id) {
        const { data: officeData } = await supabase
          .from('offices')
          .select('name')
          .eq('id', (profile as any).office_id)
          .single();
        if (officeData) {
          officeName = (officeData as any).name;
        }
      }

      // Get attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          date,
          check_in_time,
          check_out_time,
          status,
          office_id,
          offices(name)
        `)
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Get attendance window settings for status recalculation
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      // Generate all dates in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allDates: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().split('T')[0]);
      }

      // Create attendance map
      const attendanceMap = new Map<string, any>();
      attendanceData?.forEach((record: any) => {
        // Recalculate status
        let correctedStatus = record.status;
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          correctedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        }
        
        attendanceMap.set(record.date, { ...record, status: correctedStatus });
      });

      // Build records for all dates
      const records = allDates.map(date => {
        const attendance = attendanceMap.get(date);
        
        if (attendance) {
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

          return {
            date,
            status: attendance.status,
            checkInTime: checkInFormatted,
            checkOutTime: checkOutFormatted,
            officeName: attendance.offices?.name || null,
          };
        } else {
          return {
            date,
            status: 'absent' as const,
            checkInTime: null,
            checkOutTime: null,
            officeName: null,
          };
        }
      });

      // Calculate stats
      const presentCount = records.filter(r => r.status === 'present').length;
      const lateCount = records.filter(r => r.status === 'late').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const totalDays = records.length;
      const attendanceRate = totalDays > 0 ? ((presentCount + lateCount) / totalDays) * 100 : 0;

      const employee: EmployeeDetailedHistory = {
        userId: (profile as any).id,
        employeeName: (profile as any).full_name,
        email: (profile as any).email,
        officeLocation: officeName,
        records,
        stats: {
          totalDays,
          presentCount,
          lateCount,
          absentCount,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
        },
      };

      return { employee, error: null };
    } catch (err) {
      return {
        employee: null,
        error: err instanceof Error ? err : new Error('Failed to fetch employee detailed history'),
      };
    }
  },

  /**
   * Get employee attendance records with timestamps for export
   * Includes ALL employees with their status (Present, Late, Absent, Not Marked)
   * OPTIMIZED VERSION - Reduced from N+1 queries to 6 total queries
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

      // Generate all dates in the range first
      const numDays = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
      const allDates = Array.from({ length: numDays }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (numDays - 1 - i));
        return date.toISOString().split('T')[0];
      });

      // OPTIMIZED: Execute all queries in parallel using Promise.all
      const [
        employeesResult,
        attendanceResult,
        windowResult,
        recurringHolidaysResult,
        specificHolidaysResult,
        approvedLeavesResult
      ] = await Promise.all([
        // Query 1: Get ALL active employees
        supabase
          .from('profiles')
          .select('id, full_name, email, shift_type, shift_mode, shift_config')
          .eq('status', 'active')
          .eq('role', 'employee')
          .order('full_name', { ascending: true }),
        
        // Query 2: Get attendance records for the date range
        supabase
          .from('attendance')
          .select('date, check_in_time, check_out_time, status, user_id')
          .gte('date', startDate)
          .lte('date', todayStr),
        
        // Query 3: Get attendance window settings
        supabase
          .from('attendance_settings')
          .select('start_time, grace_period_minutes')
          .eq('setting_name', 'default_attendance_window')
          .eq('is_active', true)
          .maybeSingle(),
        
        // Query 4: Get ALL recurring holidays for all days in range (single query)
        supabase
          .from('employee_recurring_holidays')
          .select('employee_id, day_of_week')
          .in('day_of_week', allDates.map(date => new Date(date).getDay())),
        
        // Query 5: Get ALL specific holidays for date range (single query)
        supabase
          .from('employee_specific_holidays')
          .select('employee_id, holiday_date, reason')
          .gte('holiday_date', startDate)
          .lte('holiday_date', todayStr),
        
        // Query 6: Get ALL approved leaves for date range (single query)
        supabase
          .from('leave_requests')
          .select('employee_id, leave_type_id, start_date, end_date')
          .eq('status', 'approved')
          .lte('start_date', todayStr)
          .gte('end_date', startDate)
      ]);

      // Check for errors
      if (employeesResult.error) throw employeesResult.error;
      if (attendanceResult.error) throw attendanceResult.error;

      const employees = employeesResult.data || [];
      const attendanceData = attendanceResult.data || [];
      const windowData = windowResult.data;
      const recurringHolidays = recurringHolidaysResult.data || [];
      const specificHolidays = specificHolidaysResult.data || [];
      const approvedLeaves = approvedLeavesResult.data || [];

      // Get leave type names in one query if there are approved leaves
      let leaveTypeMap = new Map<string, string>();
      if (approvedLeaves.length > 0) {
        const leaveTypeIds = [...new Set(approvedLeaves.map((l: any) => l.leave_type_id))];
        const { data: leaveTypes } = await supabase
          .from('leave_types')
          .select('id, name')
          .in('id', leaveTypeIds);
        leaveTypeMap = new Map(leaveTypes?.map((lt: any) => [lt.id, lt.name]) || []);
      }

      // Create attendance map with recalculated status
      const attendanceMap = new Map<string, any>();
      attendanceData.forEach((record: any) => {
        const key = `${record.user_id}_${record.date}`;
        
        // RECALCULATE status based on check-in time
        let correctedStatus = record.status;
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          correctedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        }
        
        attendanceMap.set(key, { ...record, status: correctedStatus });
      });

      // Create holiday/leave map efficiently
      const holidayMap = new Map<string, string>();
      
      // Process recurring holidays
      recurringHolidays.forEach((holiday: any) => {
        allDates.forEach(date => {
          const dayOfWeek = new Date(date).getDay();
          if (dayOfWeek === holiday.day_of_week) {
            holidayMap.set(`${holiday.employee_id}_${date}`, 'Holiday');
          }
        });
      });
      
      // Process specific holidays
      specificHolidays.forEach((holiday: any) => {
        holidayMap.set(`${holiday.employee_id}_${holiday.holiday_date}`, `Holiday: ${holiday.reason}`);
      });
      
      // Process approved leaves
      approvedLeaves.forEach((leave: any) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        
        allDates.forEach(date => {
          const currentDate = new Date(date);
          if (currentDate >= startDate && currentDate <= endDate) {
            const leaveTypeName = leaveTypeMap.get(leave.leave_type_id) || 'Leave';
            holidayMap.set(`${leave.employee_id}_${date}`, `On Leave: ${leaveTypeName}`);
          }
        });
      });

      // Create records for ALL employees for ALL dates
      const records: EmployeeAttendanceRecord[] = [];
      
      employees.forEach((employee: any) => {
        allDates.forEach((date) => {
          const key = `${employee.id}_${date}`;
          const attendance = attendanceMap.get(key);
          const holidayReason = holidayMap.get(key);

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
              shift_type: employee.shift_type,
              shift_mode: employee.shift_mode,
              shift_config: employee.shift_config,
            });
          } else if (holidayReason) {
            // Employee has holiday or approved leave - don't mark as absent
            const isLeave = holidayReason.startsWith('On Leave:');
            records.push({
              employeeName: employee.full_name,
              email: employee.email,
              date: date,
              checkInTime: holidayReason,
              checkOutTime: null,
              status: isLeave ? 'on_leave' as any : 'holiday' as any,
              shift_type: employee.shift_type,
              shift_mode: employee.shift_mode,
              shift_config: employee.shift_config,
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
              shift_type: employee.shift_type,
              shift_mode: employee.shift_mode,
              shift_config: employee.shift_config,
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

  /**
   * Get employee attendance records for custom date range with actual check-in times
   */
  async getCustomRangeAttendanceRecords(
    startDate: string,
    endDate: string
  ): Promise<{ records: EmployeeAttendanceRecord[]; error: Error | null }> {
    try {
      // Get ALL active employees
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, shift_type, shift_mode, shift_config')
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
        .lte('date', endDate);

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
        
        // RECALCULATE status based on check-in time
        let correctedStatus = record.status;
        if (record.check_in_time && windowData) {
          const checkInDate = new Date(record.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          correctedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        }
        
        attendanceMap.set(key, { ...record, status: correctedStatus });
      });

      // Generate all dates in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allDates: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().split('T')[0]);
      }

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
              shift_type: employee.shift_type,
              shift_mode: employee.shift_mode,
              shift_config: employee.shift_config,
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
              shift_type: employee.shift_type,
              shift_mode: employee.shift_mode,
              shift_config: employee.shift_config,
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
        error: err instanceof Error ? err : new Error('Failed to fetch custom range attendance records'),
      };
    }
  },
};
