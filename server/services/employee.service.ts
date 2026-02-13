/**
 * Employee Service
 * Handles employee management operations
 */

import { supabase } from '../supabase/client';
import type { UserProfile } from '../types/profile';

export interface EmployeeWithAttendance extends UserProfile {
  today_status: 'present' | 'late' | 'absent' | 'not_marked';
  check_in_time: string | null;
  office_name: string | null;
  department: string | null;
}

export interface EmployeeDetailResponse {
  employee: EmployeeWithAttendance | null;
  attendanceHistory: Array<{
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: 'present' | 'late' | 'absent';
  }>;
  stats: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  error: Error | null;
}

export const employeeService = {
  /**
   * Get all employees with today's attendance status
   * Excludes admin users - only returns employees
   */
  async getAllEmployees(): Promise<{ employees: EmployeeWithAttendance[]; error: Error | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all profiles (excluding admins)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch today's attendance for all users
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('user_id, check_in_time, status')
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      // Fetch all offices
      const { data: offices, error: officesError } = await supabase
        .from('offices')
        .select('id, name');

      if (officesError) throw officesError;

      // Create maps
      const attendanceMap = new Map(
        attendanceData?.map(a => [a.user_id, a]) || []
      );
      const officeMap = new Map(
        offices?.map(o => [o.id, o.name]) || []
      );

      // Combine profiles with attendance and office names
      const employees: EmployeeWithAttendance[] = profiles?.map(profile => {
        const attendance = attendanceMap.get(profile.id);
        return {
          ...profile,
          today_status: attendance?.status || 'not_marked',
          check_in_time: attendance?.check_in_time || null,
          office_name: profile.office_location ? officeMap.get(profile.office_location) || null : null,
          department: null,
        };
      }) || [];

      return { employees, error: null };
    } catch (err) {
      return {
        employees: [],
        error: err instanceof Error ? err : new Error('Failed to fetch employees'),
      };
    }
  },

  /**
   * Get employee detail with attendance history
   */
  async getEmployeeDetail(userId: string): Promise<EmployeeDetailResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch employee profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch office name if office_location exists
      let officeName: string | null = null;
      if (profile.office_location) {
        const { data: officeData, error: officeError } = await supabase
          .from('offices')
          .select('name')
          .eq('id', profile.office_location)
          .single();
        
        if (officeData && !officeError) {
          officeName = officeData.name;
        }
      }

      // Fetch today's attendance
      const { data: todayAttendance, error: todayError } = await supabase
        .from('attendance')
        .select('check_in_time, status')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (todayError) throw todayError;

      // Fetch attendance history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: history, error: historyError } = await supabase
        .from('attendance')
        .select('date, check_in_time, check_out_time, status')
        .eq('user_id', userId)
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (historyError) throw historyError;

      // Calculate stats
      const presentCount = history?.filter(h => h.status === 'present').length || 0;
      const lateCount = history?.filter(h => h.status === 'late').length || 0;
      const absentCount = history?.filter(h => h.status === 'absent').length || 0;
      const totalDays = history?.length || 0;
      const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      const employee: EmployeeWithAttendance = {
        ...profile,
        today_status: todayAttendance?.status || 'not_marked',
        check_in_time: todayAttendance?.check_in_time || null,
        office_name: officeName,
        department: null,
      };

      return {
        employee,
        attendanceHistory: history || [],
        stats: {
          presentCount,
          lateCount,
          absentCount,
          attendanceRate,
        },
        error: null,
      };
    } catch (err) {
      return {
        employee: null,
        attendanceHistory: [],
        stats: {
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          attendanceRate: 0,
        },
        error: err instanceof Error ? err : new Error('Failed to fetch employee detail'),
      };
    }
  },

  /**
   * Update employee role
   */
  async updateEmployeeRole(userId: string, role: 'employee' | 'admin'): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update role'),
      };
    }
  },

  /**
   * Update employee status (active/blocked)
   */
  async updateEmployeeStatus(
    userId: string,
    status: 'active' | 'blocked'
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update status'),
      };
    }
  },
};
