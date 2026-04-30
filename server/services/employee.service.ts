/**
 * Employee Service
 * Handles employee management operations
 */

import { supabase } from '../supabase/client';
import type { UserProfile } from '../types/profile';
import { holidayService } from './holiday.service';

export interface EmployeeWithAttendance extends UserProfile {
  today_status: 'present' | 'late' | 'absent' | 'not_marked' | 'holiday';
  check_in_time: string | null;
  office_name: string | null;
  department: string | null;
  designation?: string | null;
  role_type?: 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern' | null;
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

      // Fetch all profiles (excluding admins and rejected employees)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .neq('status', 'rejected') // Exclude rejected employees
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
      const employeesPromises = profiles?.map(async (profile) => {
        const attendance = attendanceMap.get(profile.id);
        
        // Determine today's status
        let todayStatus: 'present' | 'late' | 'absent' | 'not_marked' | 'holiday';
        
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
            todayStatus = attendance.status as 'present' | 'late' | 'absent' | 'not_marked' | 'holiday';
          }
        } else if (profile.status === 'active') {
          // Active employee with no attendance record
          // IMPORTANT: Check if today is a holiday for this employee
          const holidayStatus = await holidayService.isEmployeeHoliday(profile.id, today);
          
          if (holidayStatus.is_holiday) {
            // Today is a holiday for this employee - mark as holiday
            todayStatus = 'holiday';
          } else if (isAfterGracePeriod) {
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

      const employees = await Promise.all(employeesPromises);

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

      // Recalculate today's status based on check-in time
      let todayStatus: 'present' | 'late' | 'absent' | 'not_marked' | 'holiday' = 'not_marked';
      
      if (todayAttendance?.check_in_time) {
        // Get attendance window settings
        const { data: windowData } = await supabase
          .from('attendance_settings')
          .select('start_time, grace_period_minutes')
          .eq('setting_name', 'default_attendance_window')
          .eq('is_active', true)
          .single();

        if (windowData) {
          const checkInDate = new Date(todayAttendance.check_in_time);
          const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
          
          const [startHour, startMinute] = windowData.start_time.split(':').map(Number);
          const windowStartMinutes = startHour * 60 + startMinute;
          const gracePeriodMinutes = windowData.grace_period_minutes || 15;
          const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
          
          // Recalculate correct status
          todayStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        } else {
          // Fallback to database status if no window data
          todayStatus = todayAttendance.status as any;
        }
      } else if (profile.status === 'active') {
        // No attendance record - check if it's a holiday
        const holidayStatus = await holidayService.isEmployeeHoliday(userId, today);
        if (holidayStatus.is_holiday) {
          todayStatus = 'holiday';
        } else {
          todayStatus = 'absent';
        }
      }

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

      // Get attendance window settings to recalculate status
      const { data: windowData } = await supabase
        .from('attendance_settings')
        .select('start_time, grace_period_minutes')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .single();

      // Recalculate status for each attendance record
      const recalculatedHistory = history?.map((record: any) => {
        if (!record.check_in_time || !windowData) {
          return record; // Keep original status if no check-in time or window data
        }

        // Recalculate status based on check-in time
        const checkInDate = new Date(record.check_in_time);
        const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
        
        const [startHour, startMinute] = windowData.start_time.split(':').map(Number);
        const windowStartMinutes = startHour * 60 + startMinute;
        const gracePeriodMinutes = windowData.grace_period_minutes || 15;
        const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
        
        // Recalculate correct status
        const correctedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
        
        return {
          ...record,
          status: correctedStatus,
        };
      }) || [];

      // Get all dates in the last 30 days
      const allDates: string[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        allDates.push(date.toISOString().split('T')[0]);
      }

      // Get holidays and leaves for this employee
      const holidayDates = new Set<string>();
      const leaveDates = new Map<string, string>(); // date -> leave type name

      // Get recurring holidays
      const { data: recurringHolidays } = await supabase
        .from('employee_recurring_holidays')
        .select('day_of_week')
        .eq('employee_id', userId);

      if (recurringHolidays) {
        const holidayDays = new Set(recurringHolidays.map((h: any) => h.day_of_week));
        allDates.forEach(date => {
          const dayOfWeek = new Date(date).getDay();
          if (holidayDays.has(dayOfWeek)) {
            holidayDates.add(date);
          }
        });
      }

      // Get specific holidays
      const { data: specificHolidays } = await supabase
        .from('employee_specific_holidays')
        .select('holiday_date')
        .eq('employee_id', userId)
        .gte('holiday_date', startDate);

      if (specificHolidays) {
        specificHolidays.forEach((h: any) => {
          holidayDates.add(h.holiday_date);
        });
      }

      // Get approved leaves
      const { data: approvedLeaves } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, leave_type_id')
        .eq('employee_id', userId)
        .eq('status', 'approved')
        .gte('end_date', startDate);

      if (approvedLeaves) {
        // Get leave type names
        const leaveTypeIds = [...new Set(approvedLeaves.map((l: any) => l.leave_type_id))];
        const { data: leaveTypes } = await supabase
          .from('leave_types')
          .select('id, name')
          .in('id', leaveTypeIds);

        const leaveTypeMap = new Map(leaveTypes?.map((lt: any) => [lt.id, lt.name]) || []);

        approvedLeaves.forEach((leave: any) => {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          const leaveTypeName = leaveTypeMap.get(leave.leave_type_id) || 'Leave';

          // Add all dates in the leave range
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (allDates.includes(dateStr)) {
              leaveDates.set(dateStr, leaveTypeName);
            }
          }
        });
      }

      // Build complete attendance history including missing dates marked as holidays
      const completeHistory = allDates.map(dateStr => {
        const existingRecord = recalculatedHistory.find((r: any) => r.date === dateStr);
        
        if (existingRecord) {
          return existingRecord;
        }

        // No attendance record for this date - check if it's a holiday or leave
        if (holidayDates.has(dateStr)) {
          return {
            date: dateStr,
            check_in_time: null,
            check_out_time: null,
            status: 'holiday',
          };
        }

        if (leaveDates.has(dateStr)) {
          return {
            date: dateStr,
            check_in_time: null,
            check_out_time: null,
            status: 'absent', // Could also be 'on_leave' if needed
          };
        }

        // No attendance, not a holiday or leave - mark as absent
        return {
          date: dateStr,
          check_in_time: null,
          check_out_time: null,
          status: 'absent',
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate stats (excluding holidays and leaves)
      const presentCount = recalculatedHistory?.filter(h => h.status === 'present').length || 0;
      const lateCount = recalculatedHistory?.filter(h => h.status === 'late').length || 0;
      
      // Count only actual absences (not holidays or leaves)
      const attendanceDates = new Set(recalculatedHistory?.map(h => h.date) || []);
      let absentCount = 0;
      
      allDates.forEach(date => {
        const hasAttendance = attendanceDates.has(date);
        const isHoliday = holidayDates.has(date);
        const isOnLeave = leaveDates.has(date);
        
        // Only count as absent if no attendance AND not holiday AND not on leave
        if (!hasAttendance && !isHoliday && !isOnLeave) {
          absentCount++;
        }
      });

      // Calculate attendance rate based on working days only
      const workingDays = allDates.length - holidayDates.size - leaveDates.size;
      const attendanceRate = workingDays > 0 
        ? Math.round(((presentCount + lateCount) / workingDays) * 100) 
        : 0;

      const employee: EmployeeWithAttendance = {
        ...profile,
        today_status: todayStatus,
        check_in_time: todayAttendance?.check_in_time || null,
        office_name: officeName,
        department: null,
      };

      return {
        employee,
        attendanceHistory: completeHistory || [],
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
   * Activate a new employee created by admin:
   * - Sets profile status to active
   * - Marks employee_request as approved (removes from pending approvals)
   * - Initializes leave balances for all leave types
   * - Copies master public holidays to employee
   * - Assigns default recurring holiday (Sunday)
   */
  async activateNewEmployee(userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabaseAny = supabase as any;
      const currentYear = new Date().getFullYear();

      // 1. Set profile to active
      const { error: profileError } = await supabaseAny
        .from('profiles')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw new Error(profileError.message);

      // 2. Mark employee_request as approved so it doesn't show in pending approvals
      await supabaseAny
        .from('employee_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // 3. Initialize leave balances
      const { data: leaveTypes } = await supabaseAny
        .from('leave_types')
        .select('id, max_per_year');

      if (leaveTypes && leaveTypes.length > 0) {
        const balanceRecords = leaveTypes.map((lt: any) => ({
          employee_id: userId,
          leave_type_id: lt.id,
          year: currentYear,
          total_leaves: lt.max_per_year || 0,
          used_leaves: 0,
          remaining_leaves: lt.max_per_year || 0
        }));
        await supabaseAny
          .from('employee_leave_balance')
          .upsert(balanceRecords, { onConflict: 'employee_id,leave_type_id,year', ignoreDuplicates: true });
      }

      // 4. Copy master public holidays
      const { data: publicHolidays } = await supabaseAny
        .from('master_public_holidays')
        .select('holiday_date, holiday_name')
        .eq('is_active', true)
        .gte('holiday_date', `${currentYear}-01-01`);

      if (publicHolidays && publicHolidays.length > 0) {
        for (const h of publicHolidays) {
          await supabaseAny
            .from('employee_specific_holidays')
            .insert({
              employee_id: userId,
              holiday_date: h.holiday_date,
              holiday_type: 'public_holiday',
              reason: h.holiday_name,
              work_applications_allowed: false
            })
            .then(({ error }: any) => {
              if (error && error.code !== '23505') {
                console.warn('[activateNewEmployee] Holiday insert warning:', error.message);
              }
            });
        }
      }

      // 5. Assign default recurring holiday (Sunday only)
      const { data: existingRecurring } = await supabaseAny
        .from('employee_recurring_holidays')
        .select('id')
        .eq('employee_id', userId);

      if (!existingRecurring || existingRecurring.length === 0) {
        await supabaseAny
          .from('employee_recurring_holidays')
          .insert({ employee_id: userId, day_of_week: 0, work_applications_allowed: false });
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[activateNewEmployee] Error:', err);
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to activate employee'),
      };
    }
  },

  /**
   * Deactivate employee (set status to blocked)
   */
  async deactivateEmployee(userId: string): Promise<{ success: boolean; error: Error | null }> {
    return this.updateEmployeeStatus(userId, 'blocked');
  },

  /**
   * Delete employee — complete cleanup including Supabase Auth user
   * Deletes all related records so the email can be reused for a new registration
   */
  async deleteEmployee(userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('🗑️  [DELETE EMPLOYEE] Starting full deletion for user:', userId);
      const supabaseAny = supabase as any;

      // Delete all related records in order (child tables first)
      const tablesToClean: Array<{ table: string; column: string }> = [
        { table: 'attendance',                   column: 'user_id' },
        { table: 'employee_requests',            column: 'user_id' },
        { table: 'employee_leave_balance',       column: 'employee_id' },
        { table: 'leave_requests',               column: 'employee_id' },
        { table: 'employee_specific_holidays',   column: 'employee_id' },
        { table: 'employee_recurring_holidays',  column: 'employee_id' },
        { table: 'performance_metrics',          column: 'employee_id' },
        { table: 'performance_alerts',           column: 'employee_id' },
        { table: 'break_logs',                   column: 'employee_id' },
        { table: 'face_encodings',               column: 'user_id' },
        { table: 'face_verification_logs',       column: 'user_id' },
        { table: 'audit_logs',                   column: 'admin_id' },
        { table: 'employee_work_applications',   column: 'employee_id' },
        { table: 'notification_history',         column: 'employee_id' },
      ];

      for (const { table, column } of tablesToClean) {
        const { error } = await supabaseAny
          .from(table)
          .delete()
          .eq(column, userId);

        if (error) {
          // Log but continue — table may not exist or have no records
          console.warn(`  ⚠️  Could not delete from ${table}:`, error.message);
        } else {
          console.log(`  ✅ Cleaned ${table}`);
        }
      }

      // Delete the profile row
      const { error: profileError, data: deletedData } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();

      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }

      if (!deletedData || deletedData.length === 0) {
        throw new Error('No profile found to delete. Check RLS policies or user existence.');
      }

      // Delete the Supabase Auth user so the email can be reused
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        // Non-critical — profile is already deleted, auth user cleanup is best-effort
        console.warn('  ⚠️  Could not delete auth user (non-critical):', authError.message);
      } else {
        console.log('  ✅ Auth user deleted — email can be reused');
      }

      console.log('  ✅ Employee fully deleted');
      return { success: true, error: null };
    } catch (err) {
      console.error('  ❌ Exception during deletion:', err);
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
   * Update employee profile (email, role, office, designation, role_type, gender)
   */
  async updateEmployeeProfile(
    userId: string,
    updates: {
      email?: string;
      role?: 'employee' | 'admin';
      office_location?: string;
      designation?: string;
      role_type?: 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern';
      gender?: string | null;
    }
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update employee profile'),
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
