/**
 * Dashboard Service
 * Handles dashboard statistics and analytics
 */

import { supabase } from '../supabase/client';

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  notMarkedToday: number;
  attendanceRate: number;
}

export interface RecentActivity {
  user_id: string;
  name: string;
  action: string;
  time: string;
  status: 'present' | 'late' | 'absent';
}

export interface PendingAction {
  title: string;
  type: 'approval' | 'leave';
  count: number;
  path: string;
}

export const dashboardService = {
  /**
   * Get dashboard statistics for admin
   * Includes logic to mark employees as absent after grace period
   */
  async getDashboardStats(): Promise<{ stats: DashboardStats; error: Error | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get total active employees (excluding admins)
      const { count: totalEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('role', 'employee');

      if (employeesError) throw employeesError;

      // Get today's attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      const presentToday = attendanceData?.filter((a: any) => a.status === 'present').length || 0;
      const lateToday = attendanceData?.filter((a: any) => a.status === 'late').length || 0;
      const absentToday = attendanceData?.filter((a: any) => a.status === 'absent').length || 0;
      const markedToday = presentToday + lateToday + absentToday;
      
      // Check if grace period has ended
      // Get attendance window settings
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .single();

      let notMarkedToday = (totalEmployees || 0) - markedToday;
      let adjustedAbsentToday = absentToday;

      if (windowData) {
        // Get current IST time
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Parse window start time and grace period
        const [startHour, startMinute] = (windowData as any).start_time.split(':').map(Number);
        const windowStartMinutes = startHour * 60 + startMinute;
        const gracePeriodMinutes = (windowData as any).grace_period_minutes || 15;
        const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;

        // If current time is after grace period, unmarked employees are considered absent
        if (currentTimeInMinutes > gracePeriodEndMinutes) {
          adjustedAbsentToday = absentToday + notMarkedToday;
          notMarkedToday = 0;
        }
      }

      // Calculate attendance rate (present + late / total employees)
      const attendanceRate = totalEmployees && totalEmployees > 0
        ? Math.round(((presentToday + lateToday) / totalEmployees) * 100)
        : 0;

      return {
        stats: {
          totalEmployees: totalEmployees || 0,
          presentToday,
          lateToday,
          absentToday: adjustedAbsentToday,
          notMarkedToday,
          attendanceRate,
        },
        error: null,
      };
    } catch (err) {
      return {
        stats: {
          totalEmployees: 0,
          presentToday: 0,
          lateToday: 0,
          absentToday: 0,
          notMarkedToday: 0,
          attendanceRate: 0,
        },
        error: err instanceof Error ? err : new Error('Failed to fetch dashboard stats'),
      };
    }
  },

  /**
   * Get recent attendance activity
   */
  async getRecentActivity(limit: number = 10): Promise<{ activities: RecentActivity[]; error: Error | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          user_id,
          check_in_time,
          status,
          profiles!inner(full_name)
        `)
        .eq('date', today)
        .order('check_in_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const activities: RecentActivity[] = data?.map((item: any) => ({
        user_id: item.user_id,
        name: (item.profiles as any).full_name,
        action: item.status === 'present' ? 'Marked Present' : item.status === 'late' ? 'Marked Late' : 'Marked Absent',
        time: new Date(item.check_in_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        status: item.status,
      })) || [];

      return { activities, error: null };
    } catch (err) {
      return {
        activities: [],
        error: err instanceof Error ? err : new Error('Failed to fetch recent activity'),
      };
    }
  },

  /**
   * Get pending actions count
   */
  async getPendingActions(): Promise<{ actions: PendingAction[]; error: Error | null }> {
    try {
      // Get pending employee requests
      const { count: pendingCount, error: pendingError } = await supabase
        .from('employee_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // If table doesn't exist or error, return empty array instead of failing
      if (pendingError) {
        console.warn('Warning: Could not fetch pending requests:', pendingError.message);
        return { actions: [], error: null }; // Return empty instead of error
      }

      const actions: PendingAction[] = [];

      if (pendingCount && pendingCount > 0) {
        actions.push({
          title: `${pendingCount} employee${pendingCount > 1 ? 's' : ''} pending approval`,
          type: 'approval',
          count: pendingCount,
          path: '/admin/pending-approvals',
        });
      }

      return { actions, error: null };
    } catch (err) {
      console.warn('Warning: Exception in getPendingActions:', err);
      return {
        actions: [],
        error: null, // Return null error to prevent dashboard from breaking
      };
    }
  },
};
