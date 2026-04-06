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
  AttendanceErrorCode,
} from '../types/attendance';
import { attendanceSettingsService } from './attendance-settings.service';
import { rateLimitService } from './rate-limit.service';
import { resolveEmployeeShift } from '../utils/shift-resolver';

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
   * Uses employee's assigned shift for attendance window validation
   * 
   * Validation Order (STRICT):
   * 1. User is authenticated
   * 2. User role = employee
   * 3. User status = active
   * 4. User has office_id
   * 5. User has shift assigned
   * 6. Current time is within shift window
   * 7. GPS coordinates provided (if strict mode enabled)
   * 8. GPS within office radius (if strict mode enabled)
   * 9. Attendance not already marked today
   * 
   * @param userProfile - User profile (must be authenticated, with shift_type)
   * @param latitude - GPS latitude
   * @param longitude - GPS longitude
   * @param ipAddress - Client IP address (optional, not used)
   * @returns AttendanceResult with success/error
   */
  async markAttendance(
    userProfile: UserProfile,
    latitude?: number,
    longitude?: number,
    ipAddress?: string,
    deviceId?: string,
    userAgent?: string
  ): Promise<AttendanceResult> {
    try {
      console.log('🔍 [MARK ATTENDANCE] Starting validation...');
      console.log('  User:', userProfile.email);
      console.log('  GPS:', latitude, longitude);
      console.log('  IP:', ipAddress);
      console.log('  Device:', deviceId);

      // ============================================
      // RATE LIMITING CHECK (FIRST LINE OF DEFENSE)
      // ============================================
      console.log('🔒 [RATE LIMIT] Checking attendance rate limit...');
      const rateLimitCheck = await rateLimitService.checkAttendance(userProfile.id);
      
      if (!rateLimitCheck.allowed) {
        console.log('  ❌ Rate limit exceeded');
        return {
          success: false,
          error: `Too many attendance requests. Please wait until ${rateLimitCheck.resetAt.toLocaleTimeString()}.`,
          errorCode: 'RATE_LIMITED',
        };
      }
      
      console.log(`  ✅ Rate limit OK (${rateLimitCheck.remaining} remaining)`);

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

      // Validation 5: Check if shift is assigned
      if (!userProfile.shift_type) {
        console.log('  ❌ No shift assigned');
        return {
          success: false,
          error: 'Shift not assigned. Please contact admin.',
          errorCode: 'NO_SHIFT_ASSIGNED',
        };
      }

      console.log('  ✅ Shift assigned:', userProfile.shift_type);

      // Validation 6: Get shift timings using resolver and check current time is within shift window
      const shift = resolveEmployeeShift(userProfile);
      
      console.log(`  📅 Shift: ${shift.name} (${shift.start} - ${shift.end})`);

      // Grace period: Fixed 10 minutes from shift start for determining PRESENT vs LATE
      const GRACE_PERIOD_MINUTES = 10;
      console.log(`  ⏱️  Grace period: ${GRACE_PERIOD_MINUTES} minutes (for check-in status)`);

      // Check if current time is within shift window
      const currentTime = getCurrentISTTime();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [shiftStartHour_check, shiftStartMinute_check] = shift.start.split(':').map(Number);
      const [shiftEndHour_check, shiftEndMinute_check] = shift.end.split(':').map(Number);
      const shiftStartInMinutes_check = shiftStartHour_check * 60 + shiftStartMinute_check;
      const shiftEndInMinutes_check = shiftEndHour_check * 60 + shiftEndMinute_check;
      const shiftStartWithGraceInMinutes_check = shiftStartInMinutes_check + GRACE_PERIOD_MINUTES;

      console.log('  🕐 Shift window check:');
      console.log(`    Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
      console.log(`    Shift starts: ${shiftStartHour_check}:${shiftStartMinute_check.toString().padStart(2, '0')}`);
      console.log(`    Shift ends: ${shiftEndHour_check}:${shiftEndMinute_check.toString().padStart(2, '0')}`);
      console.log(`    Grace period boundary: ${Math.floor(shiftStartWithGraceInMinutes_check / 60)}:${(shiftStartWithGraceInMinutes_check % 60).toString().padStart(2, '0')}`);

      // Check if within shift window (no grace period on boundaries - must be within shift hours)
      if (currentTimeInMinutes < shiftStartInMinutes_check || currentTimeInMinutes > shiftEndInMinutes_check) {
        const formattedStart = `${String(shiftStartHour_check).padStart(2, '0')}:${String(shiftStartMinute_check).padStart(2, '0')}`;
        const formattedEnd = `${String(shiftEndHour_check).padStart(2, '0')}:${String(shiftEndMinute_check).padStart(2, '0')}`;
        console.log('  ❌ Current time is outside shift window');
        return {
          success: false,
          error: `Outside ${shift.name} shift hours (${formattedStart} - ${formattedEnd})`,
          errorCode: 'ATTENDANCE_CLOSED',
        };
      }

      // Determine PRESENT vs LATE status based on grace period
      let attendanceStatus = 'present';
      if (currentTimeInMinutes > shiftStartWithGraceInMinutes_check) {
        attendanceStatus = 'late';
        console.log('  ⏰ Late detection: Check-in after grace period → LATE status');
      } else {
        console.log('  ✅ On time: Check-in within grace period → PRESENT status');
      }

      console.log('  ✅ Current time is within shift window');

      // Check strict mode setting
      const { strictMode } = await attendanceSettingsService.getStrictMode();
      console.log('  🔒 Strict mode:', strictMode);

      // If strict mode is disabled, skip GPS/WiFi validation
      if (!strictMode) {
        console.log('  ⚠️  Strict mode disabled - skipping GPS/WiFi validation');
        
        // ============================================
        // DUPLICATE CHECK (EXPLICIT APP-LEVEL)
        // ============================================
        // Check if already marked attendance today (prevent duplicate)
        const todayDate = getTodayDateIST();
        console.log('🔍 [DUPLICATE CHECK] Checking for existing attendance...');
        
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

        // Get the user's assigned office
        const { data: activeOffice } = await supabase
          .from('offices')
          .select('*')
          .eq('id', userProfile.office_location)
          .eq('is_active', true)
          .single();

        if (!activeOffice) {
          return {
            success: false,
            error: 'Your assigned office is not active. Please contact admin.',
            errorCode: 'VALIDATION_FAILED',
          };
        }

        console.log(`  📋 Marking attendance with status: ${attendanceStatus.toUpperCase()}`);
        console.log('  ✅ Marking attendance without location verification');

        // Store in UTC (toISOString() converts IST to UTC automatically)
        const checkInTime = getCurrentISTTime();
        const { data: attendance, error: insertError } = await supabase
          .from('attendance')
          .insert({
            user_id: userProfile.id,
            date: todayDate,
            check_in_time: checkInTime.toISOString(), // Stores in UTC
            status: attendanceStatus,
            office_id: (activeOffice as any).id,
            latitude: latitude || null,
            longitude: longitude || null,
            ip_address: ipAddress || null,
            device_id: deviceId || null,
            user_agent: userAgent || null,
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
      // Fetch the user's assigned office
      const { data: activeOffice, error: officeError } = await supabase
        .from('offices')
        .select('*')
        .eq('id', userProfile.office_location)
        .eq('is_active', true)
        .single();
      
      if (officeError || !activeOffice) {
        console.log('  ❌ Your assigned office is not active');
        return {
          success: false,
          error: 'Your assigned office is not active. Please contact admin.',
          errorCode: 'VALIDATION_FAILED',
        };
      }

      const office = activeOffice as any;
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
      console.log('🔍 [DUPLICATE CHECK] Checking for existing attendance...');
      
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', todayDate)
        .maybeSingle();

      if (existingAttendance) {
        console.log('  ❌ Attendance already marked for today');
        return {
          success: false,
          error: 'Attendance already marked for today',
          errorCode: 'ATTENDANCE_ALREADY_MARKED',
        };
      }
      
      console.log('  ✅ No duplicate attendance for today');

      // All validations passed - Mark attendance with late detection
      const checkInTime = getCurrentISTTime();
      const checkInHour = checkInTime.getHours();
      const checkInMinute = checkInTime.getMinutes();
      const checkInTimeInMinutes = checkInHour * 60 + checkInMinute;

      console.log('  ⏰ Late detection calculation (IST):');
      console.log('    Check-in time (IST):', `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`);
      console.log('    Check-in minutes:', checkInTimeInMinutes);

      // Parse shift start time (already in HH:MM format)
      const [shiftStartHour_gps, shiftStartMinute_gps] = shift.start.split(':').map(Number);
      const shiftStartInMinutes_gps = shiftStartHour_gps * 60 + shiftStartMinute_gps;
      
      console.log('    Shift start (IST):', `${shiftStartHour_gps}:${shiftStartMinute_gps.toString().padStart(2, '0')}`);
      console.log('    Shift start minutes:', shiftStartInMinutes_gps);
      
      const gracePeriodEndMinutes_gps = shiftStartInMinutes_gps + GRACE_PERIOD_MINUTES;

      console.log('    Grace period:', GRACE_PERIOD_MINUTES, 'minutes');
      console.log('    Grace period ends at (IST):', `${Math.floor(gracePeriodEndMinutes_gps / 60)}:${(gracePeriodEndMinutes_gps % 60).toString().padStart(2, '0')}`);
      console.log('    Grace period end minutes:', gracePeriodEndMinutes_gps);

      // Determine status based on check-in time (both in IST)
      let status: 'present' | 'late';
      console.log(`  🔍 COMPARISON: ${checkInTimeInMinutes} <= ${gracePeriodEndMinutes_gps}?`);
      if (checkInTimeInMinutes <= gracePeriodEndMinutes_gps) {
        status = 'present';
        console.log(`  ✅ Status: PRESENT (${checkInTimeInMinutes} <= ${gracePeriodEndMinutes_gps})`);
      } else {
        status = 'late';
        console.log(`  ⚠️  Status: LATE (${checkInTimeInMinutes} > ${gracePeriodEndMinutes_gps})`);
      }

      console.log('  ⏰ Check-in time analysis:');
      console.log(`    Shift starts: ${shiftStartHour_gps}:${shiftStartMinute_gps.toString().padStart(2, '0')}`);
      console.log(`    Grace period ends: ${Math.floor(gracePeriodEndMinutes_gps / 60)}:${(gracePeriodEndMinutes_gps % 60).toString().padStart(2, '0')}`);
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
          device_id: deviceId || null,
          user_agent: userAgent || null,
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
  async isWindowOpen(userProfile?: UserProfile): Promise<{
    isOpen: boolean;
    windowDisplay: string;
    error: Error | null;
  }> {
    try {
      // If no user profile provided, return global window (for backward compatibility)
      if (!userProfile || !userProfile.shift_type) {
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
      }

      // User profile provided: Check their specific shift window
      const shift = resolveEmployeeShift(userProfile);
      const currentTime = getCurrentISTTime();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [shiftStartHour, shiftStartMinute] = shift.start.split(':').map(Number);
      const [shiftEndHour, shiftEndMinute] = shift.end.split(':').map(Number);
      const shiftStartInMinutes = shiftStartHour * 60 + shiftStartMinute;
      const shiftEndInMinutes = shiftEndHour * 60 + shiftEndMinute;

      // Check if current time is within shift window
      const isOpen = currentTimeInMinutes >= shiftStartInMinutes && currentTimeInMinutes <= shiftEndInMinutes;
      
      // Format window display with shift name and times
      const startFormatted = `${String(shiftStartHour).padStart(2, '0')}:${String(shiftStartMinute).padStart(2, '0')}`;
      const endFormatted = `${String(shiftEndHour).padStart(2, '0')}:${String(shiftEndMinute).padStart(2, '0')}`;
      const windowDisplay = `${shift.name} (${startFormatted} - ${endFormatted})`;

      return {
        isOpen,
        windowDisplay,
        error: null,
      };
    } catch (error) {
      console.error('Error checking window:', error);
      return {
        isOpen: false,
        windowDisplay: 'Error',
        error: error as Error,
      };
    }
  },

  /**
   * Check out from attendance
   * Validates that user has checked in today before allowing checkout
   * 
   * @param userProfile - User profile (must be authenticated)
   * @param latitude - GPS latitude (optional)
   * @param longitude - GPS longitude (optional)
   * @returns AttendanceResult with success/error
   */
  async checkOut(
    userProfile: UserProfile,
    latitude?: number,
    longitude?: number
  ): Promise<AttendanceResult> {
    try {
      console.log('🚪 [CHECK OUT] Starting checkout process...');
      console.log('  User:', userProfile.email);
      console.log('  GPS:', latitude, longitude);

      // Validation 1: User must be authenticated
      if (!userProfile || !userProfile.id) {
        return {
          success: false,
          errorCode: 'UNAUTHORIZED',
          message: 'User not authenticated',
        };
      }

      // Validation 2: Get today's attendance
      const todayDate = getTodayDateIST();
      const { data: attendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', todayDate)
        .maybeSingle();

      if (fetchError) {
        console.log('  ❌ Error fetching attendance:', fetchError);
        return {
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: 'Failed to fetch attendance record',
        };
      }

      // Validation 3: Must have checked in today
      if (!attendance) {
        console.log('  ❌ No check-in record found for today');
        return {
          success: false,
          errorCode: 'NOT_CHECKED_IN',
          message: 'You must check in before checking out',
        };
      }

      // Type assertion after null check
      const attendanceRecord = attendance as Attendance;

      // Validation 4: Cannot checkout twice
      if (attendanceRecord.check_out_time) {
        console.log('  ❌ Already checked out');
        return {
          success: false,
          errorCode: 'ALREADY_CHECKED_OUT',
          message: 'You have already checked out today',
        };
      }

      // Get current IST time
      const now = getCurrentISTTime();
      const checkOutTime = now.toISOString();

      console.log('  ⏰ Check-out time (IST):', now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      console.log('  ⏰ Check-out time (UTC):', checkOutTime);

      // Update attendance record with checkout time
      // @ts-ignore - Supabase type inference issue with update
      const { error: updateError } = await supabase
        .from('attendance')
        // @ts-ignore
        .update({
          check_out_time: checkOutTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attendanceRecord.id);

      if (updateError) {
        console.log('  ❌ Failed to update checkout time:', updateError);
        return {
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: 'Failed to record checkout',
        };
      }

      // Calculate work hours
      const checkInTime = new Date(attendanceRecord.check_in_time);
      const checkOutTimeDate = new Date(checkOutTime);
      const workHours = (checkOutTimeDate.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      console.log('  ✅ Checkout successful');
      console.log('  ⏱️  Work hours:', workHours.toFixed(2));

      return {
        success: true,
        message: 'Checkout successful',
        attendance: {
          ...attendanceRecord,
          check_out_time: checkOutTime,
        },
        workHours: parseFloat(workHours.toFixed(2)),
      };
    } catch (err) {
      console.log('  ❌ Exception during checkout:', err);
      return {
        success: false,
        errorCode: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'Checkout failed',
      };
    }
  },

  /**
   * Get checkout status for today
   * Checks if user has checked in and/or checked out
   * 
   * @param userProfile - User profile
   * @returns Checkout status information
   */
  async getCheckoutStatus(userProfile: UserProfile): Promise<{
    canCheckOut: boolean;
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    workHours: number | null;
    error: Error | null;
  }> {
    try {
      if (!userProfile || !userProfile.id) {
        return {
          canCheckOut: false,
          hasCheckedIn: false,
          hasCheckedOut: false,
          checkInTime: null,
          checkOutTime: null,
          workHours: null,
          error: new Error('User not authenticated'),
        };
      }

      const todayDate = getTodayDateIST();
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', todayDate)
        .maybeSingle();

      if (error) {
        return {
          canCheckOut: false,
          hasCheckedIn: false,
          hasCheckedOut: false,
          checkInTime: null,
          checkOutTime: null,
          workHours: null,
          error: new Error(error.message),
        };
      }

      if (!attendance) {
        return {
          canCheckOut: false,
          hasCheckedIn: false,
          hasCheckedOut: false,
          checkInTime: null,
          checkOutTime: null,
          workHours: null,
          error: null,
        };
      }

      // Type assertion after null check
      const attendanceRecord = attendance as Attendance;

      const hasCheckedIn = !!attendanceRecord.check_in_time;
      const hasCheckedOut = !!attendanceRecord.check_out_time;
      const canCheckOut = hasCheckedIn && !hasCheckedOut;

      // Calculate work hours if checked out
      let workHours: number | null = null;
      if (hasCheckedIn && hasCheckedOut) {
        const checkInTime = new Date(attendanceRecord.check_in_time);
        const checkOutTime = new Date(attendanceRecord.check_out_time!);
        workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        workHours = parseFloat(workHours.toFixed(2));
      }

      return {
        canCheckOut,
        hasCheckedIn,
        hasCheckedOut,
        checkInTime: attendanceRecord.check_in_time,
        checkOutTime: attendanceRecord.check_out_time,
        workHours,
        error: null,
      };
    } catch (err) {
      return {
        canCheckOut: false,
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        workHours: null,
        error: err instanceof Error ? err : new Error('Failed to get checkout status'),
      };
    }
  },

  /**
   * Calculate work hours between check-in and check-out
   * 
   * @param checkInTime - Check-in timestamp
   * @param checkOutTime - Check-out timestamp
   * @returns Work hours as decimal number
   */
  calculateWorkHours(checkInTime: string, checkOutTime: string): number {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
  },

  /**
   * Admin manual checkout for an employee
   * Allows admins to manually check out employees who left without checking out
   * This prevents employees from gaming the auto-checkout system
   * 
   * @param adminProfile - Admin user profile (must be authenticated admin)
   * @param employeeId - ID of the employee to check out
   * @param checkoutDate - Date to check out (YYYY-MM-DD format, defaults to today)
   * @returns AttendanceResult with success/error
   */
  async adminCheckOut(
    adminProfile: UserProfile,
    employeeId: string,
    checkoutDate?: string
  ): Promise<AttendanceResult> {
    try {
      console.log('🔐 [ADMIN CHECKOUT] Starting admin checkout process...');
      console.log('  Admin:', adminProfile.email);
      console.log('  Employee ID:', employeeId);

      // Validation 1: Admin authentication
      if (!adminProfile || !adminProfile.id) {
        console.log('  ❌ Admin not authenticated');
        return {
          success: false,
          errorCode: 'UNAUTHORIZED',
          message: 'Admin not authenticated',
        };
      }

      // Validation 2: Admin role check
      if (adminProfile.role !== 'admin') {
        console.log('  ❌ User is not an admin');
        return {
          success: false,
          errorCode: 'UNAUTHORIZED',
          message: 'Only admins can perform manual checkout',
        };
      }

      // Use provided date or today's date
      const targetDate = checkoutDate || getTodayDateIST();
      console.log('  📅 Target date:', targetDate);

      // Get employee's attendance record for the date
      const { data: attendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', employeeId)
        .eq('date', targetDate)
        .maybeSingle();

      if (fetchError) {
        console.log('  ❌ Database error:', fetchError);
        return {
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: 'Failed to fetch attendance record',
        };
      }

      // Validation 3: Employee must have checked in
      if (!attendance) {
        console.log('  ❌ No attendance record found');
        return {
          success: false,
          errorCode: 'NOT_CHECKED_IN',
          message: 'Employee has not checked in for this date',
        };
      }

      const attendanceRecord = attendance as Attendance;

      // Validation 4: Cannot checkout if already checked out
      if (attendanceRecord.check_out_time) {
        console.log('  ❌ Already checked out');
        return {
          success: false,
          errorCode: 'ALREADY_CHECKED_OUT',
          message: 'Employee has already checked out',
        };
      }

      // Get current IST time for checkout
      const now = getCurrentISTTime();
      const checkOutTime = now.toISOString();

      console.log('  ⏰ Check-out time (IST):', now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      console.log('  ⏰ Check-out time (UTC):', checkOutTime);

      // Update attendance record with checkout time
      // @ts-ignore - Supabase type inference issue with update
      const { error: updateError } = await supabase
        .from('attendance')
        // @ts-ignore
        .update({
          check_out_time: checkOutTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attendanceRecord.id);

      if (updateError) {
        console.log('  ❌ Failed to update checkout time:', updateError);
        return {
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: 'Failed to record checkout',
        };
      }

      // Calculate work hours
      const checkInTime = new Date(attendanceRecord.check_in_time);
      const checkOutTimeDate = new Date(checkOutTime);
      const workHours = (checkOutTimeDate.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      console.log('  ✅ Admin checkout successful');
      console.log('  ⏱️  Work hours:', workHours.toFixed(2));
      console.log('  👤 Checked out by admin:', adminProfile.email);

      return {
        success: true,
        message: 'Employee checked out successfully by admin',
        attendance: {
          ...attendanceRecord,
          check_out_time: checkOutTime,
        },
        workHours: parseFloat(workHours.toFixed(2)),
      };
    } catch (err) {
      console.log('  ❌ Exception during admin checkout:', err);
      return {
        success: false,
        errorCode: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'Admin checkout failed',
      };
    }
  },
};
