/**
 * Attendance Service
 * Handles attendance marking and validation
 * CRITICAL: Attendance window is fetched from database, NOT hardcoded
 * Validation: Geofencing only (WiFi validation removed)
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

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export const attendanceService = {
  /**
   * Mark attendance for a user
   * Validates all rules before marking attendance
   * 
   * Validation Order (STRICT):
   * 1. User is authenticated
   * 2. User role = employee
   * 3. User status = active
   * 4. User has office_id
   * 5. Current time is within window (FROM DATABASE)
   * 6. GPS coordinates provided
   * 7. GPS within office radius (Haversine formula)
   * 8. Attendance not already marked today
   * 
   * @param userProfile - User profile (must be authenticated)
   * @param latitude - GPS latitude
   * @param longitude - GPS longitude
   * @param ipAddress - Client IP address (optional, not used)
   * @returns AttendanceResult with success/error
   */
  async markAttendance(
    userProfile: UserProfile,
    latitude?: number,
    longitude?: number,
    ipAddress?: string
  ): Promise<AttendanceResult> {
    try {
      console.log('🔍 [MARK ATTENDANCE] Starting validation...');
      console.log('  User:', userProfile.email);
      console.log('  GPS:', latitude, longitude);
      console.log('  IP:', ipAddress);

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

      // Validation 5: Check if yesterday's attendance was checked out
      // This prevents employees from checking in today if they didn't check out yesterday
      const yesterday = new Date(getCurrentISTTime());
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      const { data: yesterdayAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', yesterdayDate)
        .maybeSingle();

      // @ts-ignore - Supabase type inference issue
      if (yesterdayAttendance && !yesterdayAttendance.check_out_time) {
        console.log('  ❌ Yesterday check-out pending');
        return {
          success: false,
          error: 'Previous day check-out is pending. Please contact admin to resolve this issue.',
          errorCode: 'VALIDATION_FAILED',
        };
      }

      console.log('  ✅ Yesterday check-out validation passed');

      // Validation 6: Current time is within window (FROM DATABASE)
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

      // Check strict mode setting
      const { strictMode } = await attendanceSettingsService.getStrictMode();
      console.log('  🔒 Strict mode:', strictMode);

      // If strict mode is disabled, skip GPS/WiFi validation
      if (!strictMode) {
        console.log('  ⚠️  Strict mode disabled - skipping GPS/WiFi validation');
        
        // Validation: Check if yesterday's attendance was checked out
        const yesterday = new Date(getCurrentISTTime());
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        
        const { data: yesterdayAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('date', yesterdayDate)
          .maybeSingle();

        // @ts-ignore - Supabase type inference issue
        if (yesterdayAttendance && !yesterdayAttendance.check_out_time) {
          console.log('  ❌ Yesterday check-out pending');
          return {
            success: false,
            error: 'Previous day check-out is pending. Please contact admin to resolve this issue.',
            errorCode: 'VALIDATION_FAILED',
          };
        }

        console.log('  ✅ Yesterday check-out validation passed');
        
        // Validation: Check if already marked attendance today (prevent duplicate)
        const todayDate = getTodayDateIST();
        const { data: todayAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('date', todayDate)
          .maybeSingle();

        if (todayAttendance) {
          console.log('  ❌ Attendance already marked for today');
          return {
            success: false,
            error: 'Attendance already marked for today',
            errorCode: 'ATTENDANCE_ALREADY_MARKED',
          };
        }

        console.log('  ✅ No duplicate attendance for today');

        // Get the active office for office_id
        const { data: activeOffice } = await supabase
          .from('offices')
          .select('*')
          .eq('is_active', true)
          .single();

        if (!activeOffice) {
          return {
            success: false,
            error: 'Office not configured. Please contact admin.',
            errorCode: 'VALIDATION_FAILED',
          };
        }

        // Mark attendance without GPS/WiFi validation but with late detection
        const checkInTime = getCurrentISTTime();
        const checkInHour = checkInTime.getHours();
        const checkInMinute = checkInTime.getMinutes();
        const checkInTimeInMinutes = checkInHour * 60 + checkInMinute;

        console.log('  ⏰ Late detection calculation (IST):');
        console.log('    Check-in time (IST):', `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`);
        console.log('    Check-in minutes:', checkInTimeInMinutes);

        // Parse window start time (already in IST format in database)
        const [startHour, startMinute] = window.start_time.split(':').map(Number);
        const windowStartMinutes = startHour * 60 + startMinute;
        
        console.log('    Window start (IST):', `${startHour}:${startMinute.toString().padStart(2, '0')}`);
        console.log('    Window start minutes:', windowStartMinutes);
        
        // Get grace period from settings (default 15 minutes)
        const gracePeriodMinutes = window.grace_period_minutes || 15;
        const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;

        console.log('    Grace period:', gracePeriodMinutes, 'minutes');
        console.log('    Grace period ends at (IST):', `${Math.floor(gracePeriodEndMinutes / 60)}:${(gracePeriodEndMinutes % 60).toString().padStart(2, '0')}`);
        console.log('    Grace period end minutes:', gracePeriodEndMinutes);

        // Determine status based on check-in time (both in IST)
        let status: 'present' | 'late';
        console.log(`  🔍 COMPARISON: ${checkInTimeInMinutes} <= ${gracePeriodEndMinutes}?`);
        if (checkInTimeInMinutes <= gracePeriodEndMinutes) {
          status = 'present';
          console.log(`  ✅ Status: PRESENT (${checkInTimeInMinutes} <= ${gracePeriodEndMinutes})`);
        } else {
          status = 'late';
          console.log(`  ⚠️  Status: LATE (${checkInTimeInMinutes} > ${gracePeriodEndMinutes})`);
        }

        console.log('  ✅ Marking attendance without location verification');

        // Store in UTC (toISOString() converts IST to UTC automatically)
        const { data: attendance, error: insertError } = await supabase
          .from('attendance')
          .insert({
            user_id: userProfile.id,
            date: todayDate,
            check_in_time: checkInTime.toISOString(), // Stores in UTC
            status: status,
            office_id: (activeOffice as any).id,
            latitude: latitude || null,
            longitude: longitude || null,
            ip_address: ipAddress || null,
          } as any)
          .select()
          .single();

        if (insertError) {
          console.log('  ❌ Failed to insert attendance:', insertError);
          return {
            success: false,
            error: `Failed to mark attendance: ${insertError.message}`,
            errorCode: 'VALIDATION_FAILED',
          };
        }

        console.log('  ✅ Attendance marked successfully (no verification)');

        return {
          success: true,
          attendance: attendance as Attendance,
        };
      }

      // Strict mode is enabled - continue with GPS/WiFi validation
      console.log('  🔒 Strict mode enabled - performing GPS/WiFi validation');

      // Validation 7: GPS coordinates provided
      if (latitude === undefined || longitude === undefined) {
        console.log('  ❌ GPS coordinates not provided');
        return {
          success: false,
          error: 'Location permission is required to mark attendance',
          errorCode: 'GPS_REQUIRED',
        };
      }

      // Validation 8: GPS within office radius
      // SINGLE OFFICE MODE: Always fetch the active office
      const { data: activeOffice, error: officeError } = await supabase
        .from('offices')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (officeError || !activeOffice) {
        console.log('  ❌ No active office configured');
        return {
          success: false,
          error: 'Office not configured. Please contact admin.',
          errorCode: 'VALIDATION_FAILED',
        };
      }

      const office = activeOffice as any; // Type assertion for single office mode
      console.log('  🏢 Using office:', office.name);

      if (office.latitude === null || office.longitude === null) {
        return {
          success: false,
          error: 'Office location not configured. Please contact admin.',
          errorCode: 'VALIDATION_FAILED',
        };
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        office.latitude,
        office.longitude
      );

      // Get radius from office configuration (config-driven, not hardcoded)
      const radiusInMeters = office.radius_in_meters || 100; // Fallback to 100m if not set

      console.log('  📍 GPS Verification:');
      console.log('    User location:', latitude, longitude);
      console.log('    Office location:', office.latitude, office.longitude);
      console.log('    Distance:', Math.round(distance), 'meters');
      console.log('    Allowed radius:', radiusInMeters, 'meters');

      if (distance > radiusInMeters) {
        console.log('  ❌ User is outside office radius');
        return {
          success: false,
          error: `You are not inside office premises. Distance: ${Math.round(distance)}m (allowed: ${radiusInMeters}m)`,
          errorCode: 'OUTSIDE_OFFICE_LOCATION',
        };
      }

      console.log('  ✅ GPS verification passed');

      // Validation 9: Attendance not already marked today
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

      // All validations passed - Mark attendance with late detection
      const checkInTime = getCurrentISTTime();
      const checkInHour = checkInTime.getHours();
      const checkInMinute = checkInTime.getMinutes();
      const checkInTimeInMinutes = checkInHour * 60 + checkInMinute;

      console.log('  ⏰ Late detection calculation (IST):');
      console.log('    Check-in time (IST):', `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`);
      console.log('    Check-in minutes:', checkInTimeInMinutes);

      // Parse window start time (already in IST format in database)
      const [startHour, startMinute] = window.start_time.split(':').map(Number);
      const windowStartMinutes = startHour * 60 + startMinute;
      
      console.log('    Window start (IST):', `${startHour}:${startMinute.toString().padStart(2, '0')}`);
      console.log('    Window start minutes:', windowStartMinutes);
      
      // Get grace period from settings (default 15 minutes)
      const gracePeriodMinutes = window.grace_period_minutes || 15;
      const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;

      console.log('    Grace period:', gracePeriodMinutes, 'minutes');
      console.log('    Grace period ends at (IST):', `${Math.floor(gracePeriodEndMinutes / 60)}:${(gracePeriodEndMinutes % 60).toString().padStart(2, '0')}`);
      console.log('    Grace period end minutes:', gracePeriodEndMinutes);

      // Determine status based on check-in time (both in IST)
      let status: 'present' | 'late';
      console.log(`  🔍 COMPARISON: ${checkInTimeInMinutes} <= ${gracePeriodEndMinutes}?`);
      if (checkInTimeInMinutes <= gracePeriodEndMinutes) {
        status = 'present';
        console.log(`  ✅ Status: PRESENT (${checkInTimeInMinutes} <= ${gracePeriodEndMinutes})`);
      } else {
        status = 'late';
        console.log(`  ⚠️  Status: LATE (${checkInTimeInMinutes} > ${gracePeriodEndMinutes})`);
      }

      console.log('  ⏰ Check-in time analysis:');
      console.log(`    Window starts: ${startHour}:${startMinute.toString().padStart(2, '0')}`);
      console.log(`    Grace period ends: ${Math.floor(gracePeriodEndMinutes / 60)}:${(gracePeriodEndMinutes % 60).toString().padStart(2, '0')}`);
      console.log(`    Check-in time: ${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`);
      console.log(`    Status: ${status.toUpperCase()}`);

      console.log('  ✅ All validations passed - marking attendance');

      // Store in UTC (toISOString() converts IST to UTC automatically)
      const { data: attendance, error: insertError } = await supabase
        .from('attendance')
        .insert({
          user_id: userProfile.id,
          date: todayDate,
          check_in_time: checkInTime.toISOString(), // Stores in UTC
          status: status,
          office_id: (office as any).id, // Use the active office ID
          latitude: latitude,
          longitude: longitude,
          ip_address: ipAddress,
        } as any)
        .select()
        .single();

      if (insertError) {
        console.log('  ❌ Failed to insert attendance:', insertError);
        return {
          success: false,
          error: `Failed to mark attendance: ${insertError.message}`,
          errorCode: 'VALIDATION_FAILED',
        };
      }

      console.log('  ✅ Attendance marked successfully');

      return {
        success: true,
        attendance: attendance as Attendance,
      };
    } catch (err) {
      console.log('  ❌ Exception in markAttendance:', err);
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
