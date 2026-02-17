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

      // Get attendance window settings to check if grace period has ended
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .single();

      let isAfterGracePeriod = false;
      if (windowData) {
        // Get current IST time
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Parse window start time and grace period
        const [startHour, startMinute] = windowData.start_time.split(':').map(Number);
        const windowStartMinutes = startHour * 60 + startMinute;
        const gracePeriodMinutes = windowData.grace_period_minutes || 15;
        const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;

        // Check if current time is after grace period
        isAfterGracePeriod = currentTimeInMinutes > gracePeriodEndMinutes;
      }

      // Combine profiles with attendance and office names
      const employees: EmployeeWithAttendance[] = profiles?.map(profile => {
        const attendance = attendanceMap.get(profile.id);
        
        // Determine today's status
        let todayStatus: 'present' | 'late' | 'absent' | 'not_marked';
        
        // If employee is pending approval, they shouldn't be marked absent
        if (profile.status === 'pending') {
          todayStatus = 'not_marked'; // Awaiting approval, not absent
        } else if (profile.status === 'blocked') {
          todayStatus = 'not_marked'; // Blocked employees don't count as absent
        } else if (attendance?.status) {
          // Employee has attendance record - RECALCULATE status based on check-in time
          if (attendance.check_in_time && windowData) {
            const checkInDate = new Date(attendance.check_in_time);
            const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
            
            const [startHour, startMinute] = windowData.start_time.split(':').map(Number);
            const windowStartMinutes = startHour * 60 + startMinute;
            const gracePeriodMinutes = windowData.grace_period_minutes || 15;
            const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
            
            // Recalculate correct status
            todayStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
          } else {
            // If no check-in time or window data, use database status
            todayStatus = attendance.status as 'present' | 'late' | 'absent' | 'not_marked';
          }
        } else if (profile.status === 'active') {
          // Active employee with no attendance record
          if (isAfterGracePeriod) {
            // Grace period has ended - mark as absent
            todayStatus = 'absent';
          } else {
            // Grace period still active - mark as absent (they should have checked in by now)
            // Changed from 'not_marked' to 'absent' so active employees show as absent, not awaiting
            todayStatus = 'absent';
          }
        } else {
          // Other statuses (shouldn't happen, but fallback)
          todayStatus = 'not_marked';
        }
        
        return {
          ...profile,
          today_status: todayStatus,
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

  /**
   * Activate employee (set status to active)
   */
  async activateEmployee(userId: string): Promise<{ success: boolean; error: Error | null }> {
    return this.updateEmployeeStatus(userId, 'active');
  },

  /**
   * Deactivate employee (set status to blocked)
   */
  async deactivateEmployee(userId: string): Promise<{ success: boolean; error: Error | null }> {
    return this.updateEmployeeStatus(userId, 'blocked');
  },

  /**
   * Delete employee (soft delete by setting status to deleted)
   * Note: This doesn't actually delete the record, just marks it as deleted
   */
  async deleteEmployee(userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Option 1: Soft delete (mark as deleted)
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'blocked' }) // Using blocked as soft delete
        .eq('id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to delete employee'),
      };
    }
  },

  /**
   * Update employee office location
   */
  async updateEmployeeOffice(
    userId: string,
    officeId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ office_location: officeId })
        .eq('id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update office'),
      };
    }
  },

  /**
   * Get employee statistics for management dashboard
   */
  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    blocked: number;
    error: Error | null;
  }> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('role', 'employee');

      if (error) throw error;

      const stats = {
        total: profiles?.length || 0,
        active: profiles?.filter(p => p.status === 'active').length || 0,
        pending: profiles?.filter(p => p.status === 'pending').length || 0,
        blocked: profiles?.filter(p => p.status === 'blocked').length || 0,
        error: null,
      };

      return stats;
    } catch (err) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        blocked: 0,
        error: err instanceof Error ? err : new Error('Failed to fetch stats'),
      };
    }
  },
};
