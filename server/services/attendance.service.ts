/**
 * Attendance Service
 * Handles attendance marking and validation
 * Phase 3: Attendance marking with strict validation rules
 */

import { supabase } from '../supabase/client';
import type { UserProfile } from '../types/profile';
import type {
  Attendance,
  AttendanceResult,
  TodayAttendanceResponse,
} from '../types/attendance';
import {
  getCurrentISTTime,
  getTodayDateIST,
  isWithinAttendanceWindow,
  getAttendanceWindowString,
  ATTENDANCE_CONFIG,
} from '../config/attendance.config';

export const attendanceService = {
  /**
   * Mark attendance for a user
   * Validates all rules before marking attendance
   * 
   * Validation Order:
   * 1. User is authenticated
   * 2. User role = employee
   * 3. User status = active
   * 4. User has office_id
   * 5. Current time is within window
   * 6. Attendance not already marked today
   * 
   * @param userProfile - User profile (must be authenticated)
   * @returns AttendanceResult with success/error
   */
  async markAttendance(userProfile: UserProfile): Promise<AttendanceResult> {
    try {
      // Validation 1: User is authenticated (profile exists)
      if (!userProfile || !userProfile.id) {
        return {
          success: false,
          error: 'User not authenticated',
          errorCode: 'UNAUTHORIZED',
        };
      }

      // Validation 2: User role = employee
      if (userProfile.role !== 'employee') {
        return {
          success: false,
          error: 'Only employees can mark attendance. Admins cannot mark attendance.',
          errorCode: 'NOT_EMPLOYEE',
        };
      }

      // Validation 3: User status = active
      if (userProfile.status !== 'active') {
        return {
          success: false,
          error: `Account status is '${userProfile.status}'. Only active users can mark attendance.`,
          errorCode: 'ACCOUNT_NOT_ACTIVE',
        };
      }

      // Validation 4: User has office_id
      if (!userProfile.office_location) {
        return {
          success: false,
          error: 'No office assigned. Please contact admin.',
          errorCode: 'NO_OFFICE_ASSIGNED',
        };
      }

      // Validation 5: Current time is within window
      if (!isWithinAttendanceWindow()) {
        return {
          success: false,
          error: `Attendance can only be marked between ${getAttendanceWindowString()}`,
          errorCode: 'OUTSIDE_TIME_WINDOW',
        };
      }

      // Validation 6: Attendance not already marked today
      const todayDate = getTodayDateIST();
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', todayDate)
        .single();

      if (existingAttendance) {
        return {
          success: false,
          error: 'Attendance already marked for today',
          errorCode: 'ATTENDANCE_ALREADY_MARKED',
        };
      }

      // All validations passed - Mark attendance
      const checkInTime = getCurrentISTTime().toISOString();
      const status = ATTENDANCE_CONFIG.STATUS_RULES.ON_TIME; // present

      const { data: attendance, error: insertError } = await supabase
        .from('attendance')
        .insert({
          user_id: userProfile.id,
          date: todayDate,
          check_in_time: checkInTime,
          status: status,
          office_id: userProfile.office_location,
        })
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          error: `Failed to mark attendance: ${insertError.message}`,
          errorCode: 'VALIDATION_FAILED',
        };
      }

      return {
        success: true,
        attendance: attendance as Attendance,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to mark attendance',
        errorCode: 'VALIDATION_FAILED',
      };
    }
  },

  /**
   * Get today's attendance for a user
   * Optional but recommended for checking if attendance is already marked
   * 
   * @param userProfile - User profile
   * @returns TodayAttendanceResponse with attendance or null
   */
  async getTodayAttendance(userProfile: UserProfile): Promise<TodayAttendanceResponse> {
    try {
      if (!userProfile || !userProfile.id) {
        return {
          attendance: null,
          error: new Error('User not authenticated'),
        };
      }

      const todayDate = getTodayDateIST();

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', todayDate)
        .single();

      if (error) {
        // PGRST116 = no rows (attendance not marked yet)
        if (error.code === 'PGRST116') {
          return { attendance: null, error: null };
        }
        return {
          attendance: null,
          error: new Error(error.message),
        };
      }

      return {
        attendance: data as Attendance,
        error: null,
      };
    } catch (err) {
      return {
        attendance: null,
        error: err instanceof Error ? err : new Error('Failed to fetch attendance'),
      };
    }
  },

  /**
   * Get attendance history for a user
   * Returns all attendance records for a user
   * 
   * @param userProfile - User profile
   * @param limit - Optional limit (default: 30 days)
   * @returns Array of attendance records
   */
  async getAttendanceHistory(
    userProfile: UserProfile,
    limit: number = 30
  ): Promise<{ attendance: Attendance[]; error: Error | null }> {
    try {
      if (!userProfile || !userProfile.id) {
        return {
          attendance: [],
          error: new Error('User not authenticated'),
        };
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          attendance: [],
          error: new Error(error.message),
        };
      }

      return {
        attendance: (data || []) as Attendance[],
        error: null,
      };
    } catch (err) {
      return {
        attendance: [],
        error: err instanceof Error ? err : new Error('Failed to fetch history'),
      };
    }
  },
};
