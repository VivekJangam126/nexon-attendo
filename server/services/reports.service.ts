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

export const reportsService = {
  /**
   * Get attendance statistics for a time range
   */
  async getAttendanceStats(
    timeRange: 'today' | 'week' | 'month'
  ): Promise<{ stats: ReportStats; error: Error | null }> {
    try {
      const today = new Date();
      let startDate: string;
      let previousStartDate: string;
      let previousEndDate: string;

      // Calculate date ranges
      if (timeRange === 'today') {
        startDate = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        previousStartDate = yesterday.toISOString().split('T')[0];
        previousEndDate = previousStartDate;
      } else if (timeRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        previousStartDate = twoWeeksAgo.toISOString().split('T')[0];
        previousEndDate = weekAgo.toISOString().split('T')[0];
      } else {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        startDate = monthAgo.toISOString().split('T')[0];
        
        const twoMonthsAgo = new Date(today);
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
        previousStartDate = twoMonthsAgo.toISOString().split('T')[0];
        previousEndDate = monthAgo.toISOString().split('T')[0];
      }

      // Get total active employees
      const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('role', 'employee');

      // Get current period attendance
      const { data: currentData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', startDate);

      // Get previous period attendance
      const { data: previousData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', previousStartDate)
        .lte('date', previousEndDate);

      const present = currentData?.filter((a: any) => a.status === 'present').length || 0;
      const late = currentData?.filter((a: any) => a.status === 'late').length || 0;
      const absent = currentData?.filter((a: any) => a.status === 'absent').length || 0;

      const previousPresent = previousData?.filter((a: any) => a.status === 'present').length || 0;
      const previousLate = previousData?.filter((a: any) => a.status === 'late').length || 0;

      const currentRate = totalEmployees && totalEmployees > 0
        ? ((present + late) / (currentData?.length || 1)) * 100
        : 0;

      const previousRate = totalEmployees && totalEmployees > 0
        ? ((previousPresent + previousLate) / (previousData?.length || 1)) * 100
        : 0;

      const comparedToPrevious = currentRate - previousRate;

      return {
        stats: {
          totalEmployees: totalEmployees || 0,
          present,
          late,
          absent,
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
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const startDate = weekAgo.toISOString().split('T')[0];

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', startDate)
        .order('date', { ascending: true });

      // Group by date
      const dateMap = new Map<string, { present: number; late: number; absent: number }>();
      
      attendanceData?.forEach((record: any) => {
        if (!dateMap.has(record.date)) {
          dateMap.set(record.date, { present: 0, late: 0, absent: 0 });
        }
        const stats = dateMap.get(record.date)!;
        if (record.status === 'present') stats.present++;
        else if (record.status === 'late') stats.late++;
        else if (record.status === 'absent') stats.absent++;
      });

      const breakdown: DailyBreakdown[] = Array.from(dateMap.entries()).map(([date, stats]) => {
        const dateObj = new Date(date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
          day: dayNames[dateObj.getDay()],
          date,
          ...stats,
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
};
