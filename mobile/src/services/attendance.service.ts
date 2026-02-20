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
    
    // Call the backend RPC function or insert directly
    // The backend will handle all validation
    const { data, error } = await supabase.rpc('mark_attendance', {
      p_user_id: userProfile.id,
      p_latitude: latitude,
      p_longitude: longitude,
      p_device_id: deviceId,
      p_user_agent: userAgent,
    });
    
    if (error) {
      console.log('  ❌ Attendance marking failed:', error.message);
      
      // Parse error message to extract error code if available
      const errorCode = extractErrorCode(error.message);
      
      return {
        success: false,
        error: error.message,
        errorCode,
      };
    }
    
    console.log('  ✅ Attendance marked successfully');
    
    return {
      success: true,
      attendance: data as Attendance,
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
 * Helper: Get today's date in IST (YYYY-MM-DD)
 */
const getTodayDateIST = (): string => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
