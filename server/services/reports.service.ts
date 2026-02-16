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

      // Get current period attendance with proper date range
      const { data: currentData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', startDate)
        .lte('date', endDate);

      // Get previous period attendance
      const { data: previousData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', previousStartDate)
        .lte('date', previousEndDate);

      // Count present and late from attendance records
      const present = currentData?.filter((a: any) => a.status === 'present').length || 0;
      const late = currentData?.filter((a: any) => a.status === 'late').length || 0;
      
      // Calculate absent as: total employees - (present + late)
      // This accounts for employees who didn't check in at all
      const absent = (totalEmployees || 0) - (present + late);

      const previousPresent = previousData?.filter((a: any) => a.status === 'present').length || 0;
      const previousLate = previousData?.filter((a: any) => a.status === 'late').length || 0;

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

      // Get attendance data for the week
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', startDate)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      // Group by date
      const dateMap = new Map<string, { present: number; late: number }>();
      
      attendanceData?.forEach((record: any) => {
        if (!dateMap.has(record.date)) {
          dateMap.set(record.date, { present: 0, late: 0 });
        }
        const stats = dateMap.get(record.date)!;
        if (record.status === 'present') stats.present++;
        else if (record.status === 'late') stats.late++;
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

      // Get attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', startDate)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      // Group by date
      const dateMap = new Map<string, { present: number; late: number }>();
      
      attendanceData?.forEach((record: any) => {
        if (!dateMap.has(record.date)) {
          dateMap.set(record.date, { present: 0, late: 0 });
        }
        const stats = dateMap.get(record.date)!;
        if (record.status === 'present') stats.present++;
        else if (record.status === 'late') stats.late++;
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

      // Get attendance records with employee details
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
        .lte('date', todayStr)
        .order('date', { ascending: true })
        .order('check_in_time', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Get all employee profiles
      const userIds = attendanceData?.map((a: any) => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, { name: p.full_name, email: p.email }]) || []);

      // Format records
      const records: EmployeeAttendanceRecord[] = attendanceData?.map((record: any) => {
        const profile = profileMap.get(record.user_id);
        
        // Format check-in time (without seconds for shorter display)
        const checkInDate = new Date(record.check_in_time);
        const checkInFormatted = checkInDate.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Format check-out time if exists
        let checkOutFormatted = null;
        if (record.check_out_time) {
          const checkOutDate = new Date(record.check_out_time);
          checkOutFormatted = checkOutDate.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }

        return {
          employeeName: profile?.name || 'Unknown',
          email: profile?.email || 'N/A',
          date: record.date,
          checkInTime: checkInFormatted,
          checkOutTime: checkOutFormatted,
          status: record.status,
        };
      }) || [];

      return { records, error: null };
    } catch (err) {
      return {
        records: [],
        error: err instanceof Error ? err : new Error('Failed to fetch employee attendance records'),
      };
    }
  },
};
