/**
 * Attendance Service
 * Handles attendance marking and validation
 * Phase 3: Attendance marking with strict validation
 * CRITICAL: Attendance window is fetched from database, NOT hardcoded
 */

import { supabase } from '../supabase/client';
import type { UserProfile } from '../types/profile';
import type {
  Attendance,
  AttendanceResult,
  TodayAttendanceResponse,
} from '../types/attendance';
import { attendanceSettingsService } from './attendance-settings.service';

/**
 * Get current IST time
 */
function getCurrentISTTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Get today's date in YYYY-MM-DD format (IST)
 */
function getTodayDateIST(): string {
  const now = getCurrentISTTime();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
   * 5. Current time is within window (FROM DATABASE)
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

      // Validation 5: Current time is within window (FROM DATABASE)
      const { isOpen, window, error: windowError } = await attendanceSettingsService.isAttendanceWindowOpen();
      
      if (windowError || !window) {
        return {
          success: false,
          error: 'Unable to verify attendance window. Please contact admin.',
          errorCode: 'VALIDATION_FAILED',
        };
      }

      if (!isOpen) {
        const windowDisplay = attendanceSettingsService.formatWindowTime(window);
        return {
          success: false,
          error: `Attendance is currently closed. Attendance window: ${windowDisplay}`,
          errorCode: 'ATTENDANCE_CLOSED',
        };
      }

      // Validation 6: Attendance not already marked today
      const todayDate = getTodayDateIST();
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', todayDate)
        .maybeSingle();

      if (existingAttendance) {
        return {
          success: false,
          error: 'Attendance already marked for today',
          errorCode: 'ATTENDANCE_ALREADY_MARKED',
        };
      }

      // All validations passed - Mark attendance
      const checkInTime = getCurrentISTTime().toISOString();
      const status = 'present'; // Simple status for now

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
        .maybeSingle();

      if (error) {
        return {
          attendance: null,
          error: new Error(error.message),
        };
      }

      return {
        attendance: data as Attendance | null,
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

  /**
   * Check if attendance window is currently open
   * Uses database settings, NOT hardcoded values
   */
  async isWindowOpen(): Promise<{
    isOpen: boolean;
    windowDisplay: string;
    error: Error | null;
  }> {
    const { isOpen, window, error } = await attendanceSettingsService.isAttendanceWindowOpen();
    
    if (error || !window) {
      return {
        isOpen: false,
        windowDisplay: 'Unknown',
        error: error || new Error('No attendance window configured'),
      };
    }

    return {
      isOpen,
      windowDisplay: attendanceSettingsService.formatWindowTime(window),
      error: null,
    };
  },
};
