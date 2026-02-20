/**
 * Attendance Service
 * Handles attendance marking and history
 */

import { supabase } from '../config/supabase';
import { Attendance, AttendanceResult, AttendanceWindow } from '../types/attendance';
import { UserProfile } from '../types/auth';

/**
 * Mark attendance
 * Sends request to backend with GPS coordinates and device info
 */
export const markAttendance = async (
  userProfile: UserProfile,
  latitude: number,
  longitude: number,
  deviceId: string,
  userAgent: string
): Promise<AttendanceResult> => {
  try {
    console.log('✅ Marking attendance...');
    console.log('  User:', userProfile.email);
    console.log('  Location:', latitude, longitude);
    console.log('  Device:', deviceId);
    
    // Call the backend RPC function
    // The backend will handle all validation
    const { data, error } = await supabase.rpc('mark_attendance', {
      p_user_id: userProfile.id,
      p_latitude: latitude,
      p_longitude: longitude,
      p_device_id: deviceId,
      p_user_agent: userAgent,
    });
    
    console.log('  📦 RPC Response:', { data, error });
    
    if (error) {
      console.log('  ❌ RPC Error:', error.message);
      
      // Parse error message to extract error code if available
      const errorCode = extractErrorCode(error.message);
      
      return {
        success: false,
        error: error.message,
        errorCode,
      };
    }
    
    // The RPC function returns a JSON object
    // Check if the function itself returned an error
    if (data && typeof data === 'object') {
      if (data.success === false) {
        console.log('  ❌ Function returned error:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to mark attendance',
          errorCode: data.errorCode || 'VALIDATION_FAILED',
        };
      }
      
      if (data.success === true) {
        console.log('  ✅ Attendance marked successfully');
        return {
          success: true,
          attendance: data.attendance as Attendance,
        };
      }
    }
    
    // Unexpected response format
    console.log('  ⚠️  Unexpected response format:', data);
    return {
      success: false,
      error: 'Unexpected response from server',
      errorCode: 'VALIDATION_FAILED',
    };
  } catch (error) {
    console.error('  ❌ Attendance marking exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark attendance',
      errorCode: 'VALIDATION_FAILED',
    };
  }
};

/**
 * Get today's attendance
 */
export const getTodayAttendance = async (userId: string): Promise<Attendance | null> => {
  try {
    console.log('📅 Fetching today\'s attendance...');
    
    // Get today's date in IST
    const today = getTodayDateIST();
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    
    if (error) {
      console.error('  ❌ Error fetching today\'s attendance:', error);
      return null;
    }
    
    if (data) {
      console.log('  ✅ Today\'s attendance found:', data.status);
    } else {
      console.log('  ℹ️  No attendance marked today');
    }
    
    return data as Attendance | null;
  } catch (error) {
    console.error('  ❌ Exception fetching today\'s attendance:', error);
    return null;
  }
};

/**
 * Get attendance history
 */
export const getAttendanceHistory = async (
  userId: string,
  limit: number = 30
): Promise<Attendance[]> => {
  try {
    console.log('📜 Fetching attendance history...');
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('  ❌ Error fetching history:', error);
      return [];
    }
    
    console.log('  ✅ Fetched', data?.length || 0, 'records');
    
    return (data || []) as Attendance[];
  } catch (error) {
    console.error('  ❌ Exception fetching history:', error);
    return [];
  }
};

/**
 * Get strict mode setting
 */
export const getStrictMode = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('attendance_settings')
      .select('strict_mode')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      console.log('  ⚠️  Could not fetch strict mode, defaulting to true');
      return true; // Default to strict mode if error
    }
    
    console.log('  🔒 Strict mode:', data.strict_mode);
    return data.strict_mode ?? true;
  } catch (error) {
    console.error('  ❌ Error fetching strict mode:', error);
    return true; // Default to strict mode
  }
};

/**
 * Get active attendance window
 */
export const getActiveWindow = async (): Promise<AttendanceWindow | null> => {
  try {
    const { data, error } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      console.error('  ❌ Error fetching attendance window:', error);
      return null;
    }
    
    return data as AttendanceWindow;
  } catch (error) {
    console.error('  ❌ Exception fetching attendance window:', error);
    return null;
  }
};

/**
 * Check if attendance window is currently open
 */
export const isWindowOpen = async (): Promise<{ isOpen: boolean; windowDisplay: string }> => {
  try {
    const window = await getActiveWindow();
    
    if (!window) {
      return {
        isOpen: false,
        windowDisplay: 'Window not configured',
      };
    }

    // Get current IST time
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Parse window times
    const [startHour, startMinute] = window.start_time.split(':').map(Number);
    const [endHour, endMinute] = window.end_time.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    // Format time for display
    const formatTime = (hour: number, minute: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    const windowDisplay = `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;

    const isOpen = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;

    return {
      isOpen,
      windowDisplay,
    };
  } catch (error) {
    console.error('  ❌ Exception checking window status:', error);
    return {
      isOpen: false,
      windowDisplay: 'Error checking window',
    };
  }
};

/**
 * Helper: Get today's date in IST (YYYY-MM-DD)
 */
const getTodayDateIST = (): string => {
  try {
    // Get current UTC time
    const now = new Date();
    
    // Convert to IST by adding 5.5 hours (19800000 milliseconds)
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    
    const dateString = `${year}-${month}-${day}`;
    console.log('  📅 Today\'s date (IST):', dateString);
    
    return dateString;
  } catch (error) {
    console.error('  ❌ Error getting today\'s date:', error);
    // Fallback to simple date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Helper: Extract error code from error message
 */
const extractErrorCode = (message: string): any => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return 'RATE_LIMITED';
  }
  if (lowerMessage.includes('already marked')) {
    return 'ATTENDANCE_ALREADY_MARKED';
  }
  if (lowerMessage.includes('outside') || lowerMessage.includes('radius')) {
    return 'OUTSIDE_OFFICE_LOCATION';
  }
  if (lowerMessage.includes('location') || lowerMessage.includes('gps')) {
    return 'GPS_REQUIRED';
  }
  if (lowerMessage.includes('closed') || lowerMessage.includes('window')) {
    return 'ATTENDANCE_CLOSED';
  }
  if (lowerMessage.includes('not active')) {
    return 'ACCOUNT_NOT_ACTIVE';
  }
  if (lowerMessage.includes('no office')) {
    return 'NO_OFFICE_ASSIGNED';
  }
  
  return 'VALIDATION_FAILED';
};
