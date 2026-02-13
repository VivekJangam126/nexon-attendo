/**
 * Attendance Settings Service
 * Manages admin-configurable attendance window
 * CRITICAL: Attendance window is NOT hardcoded - it comes from database
 */

import { supabase } from '../supabase/client';

export interface AttendanceWindow {
  id: string;
  setting_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWindowResponse {
  window: AttendanceWindow | null;
  error: Error | null;
}

export interface UpdateWindowResponse {
  success: boolean;
  error: Error | null;
}

export const attendanceSettingsService = {
  /**
   * Get active attendance window from database
   * This is the ONLY source of truth for attendance timing
   */
  async getActiveWindow(): Promise<AttendanceWindowResponse> {
    try {
      console.log('🔍 [GET ACTIVE WINDOW] Fetching from database...');
      
      const { data, error } = await supabase
        .from('attendance_settings')
        .select('*')
        .eq('setting_name', 'default_attendance_window')
        .eq('is_active', true)
        .maybeSingle();

      console.log('  📊 Query result - data:', data);
      console.log('  📊 Query result - error:', error);

      if (error) {
        console.log('  ❌ Database error:', error.message);
        return {
          window: null,
          error: new Error(error.message),
        };
      }

      if (!data) {
        console.log('  ⚠️  No active attendance window found in database');
        return {
          window: null,
          error: new Error('No active attendance window configured'),
        };
      }

      console.log('  ✅ Window fetched successfully:', {
        start: (data as any).start_time,
        end: (data as any).end_time,
        active: (data as any).is_active
      });

      return {
        window: data as AttendanceWindow,
        error: null,
      };
    } catch (err) {
      console.log('  ❌ Exception in getActiveWindow:', err);
      return {
        window: null,
        error: err instanceof Error ? err : new Error('Failed to fetch attendance window'),
      };
    }
  },

  /**
   * Check if current time is within attendance window
   * Uses server IST time and compares with database settings
   * 
   * @returns { isOpen: boolean, window: AttendanceWindow | null, error: Error | null }
   */
  async isAttendanceWindowOpen(): Promise<{
    isOpen: boolean;
    window: AttendanceWindow | null;
    error: Error | null;
  }> {
    try {
      // Get window from database
      const { window, error } = await this.getActiveWindow();

      console.log('🔍 [ATTENDANCE WINDOW CHECK]');
      console.log('  Database window:', window);
      console.log('  Database error:', error);

      if (error || !window) {
        console.log('  ❌ No window found or error occurred');
        return {
          isOpen: false,
          window: null,
          error: error || new Error('No active attendance window found'),
        };
      }

      // Get current IST time
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      console.log('  ⏰ Current IST time:', `${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
      console.log('  ⏰ Current time in minutes:', currentTimeInMinutes);

      // Parse start and end times from database
      const [startHour, startMinute] = window.start_time.split(':').map(Number);
      const [endHour, endMinute] = window.end_time.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      console.log('  📅 Window start:', `${startHour}:${startMinute.toString().padStart(2, '0')} (${startTimeInMinutes} min)`);
      console.log('  📅 Window end:', `${endHour}:${endMinute.toString().padStart(2, '0')} (${endTimeInMinutes} min)`);

      // Check if current time is within window
      const isOpen = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;

      console.log('  🎯 Comparison:', `${currentTimeInMinutes} >= ${startTimeInMinutes} && ${currentTimeInMinutes} <= ${endTimeInMinutes}`);
      console.log('  ✅ Window is open:', isOpen);

      return {
        isOpen,
        window,
        error: null,
      };
    } catch (err) {
      console.log('  ❌ Exception occurred:', err);
      return {
        isOpen: false,
        window: null,
        error: err instanceof Error ? err : new Error('Failed to check attendance window'),
      };
    }
  },

  /**
   * Update attendance window (admin only)
   * 
   * @param startTime - Start time in HH:MM:SS format
   * @param endTime - End time in HH:MM:SS format
   * @param adminId - Admin user ID
   */
  async updateWindow(
    startTime: string,
    endTime: string,
    adminId: string
  ): Promise<UpdateWindowResponse> {
    try {
      console.log('🔄 [UPDATE WINDOW] Updating attendance window...');
      console.log('  Start time:', startTime);
      console.log('  End time:', endTime);
      console.log('  Admin ID:', adminId);

      const updateData: Partial<AttendanceWindow> = {
        start_time: startTime,
        end_time: endTime,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      };

      // @ts-ignore - Database types not fully generated
      const { error } = await supabase
        .from('attendance_settings')
        .update(updateData)
        .eq('setting_name', 'default_attendance_window');

      if (error) {
        console.log('  ❌ Update failed:', error.message);
        return {
          success: false,
          error: new Error(error.message),
        };
      }

      console.log('  ✅ Window updated successfully');
      return {
        success: true,
        error: null,
      };
    } catch (err) {
      console.log('  ❌ Exception in updateWindow:', err);
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update attendance window'),
      };
    }
  },

  /**
   * Get attendance window for display (used by settings page)
   */
  async getAttendanceWindow(): Promise<{
    window: { start_time: string; end_time: string } | null;
    error: Error | null;
  }> {
    try {
      const { window, error } = await this.getActiveWindow();
      
      if (error || !window) {
        return {
          window: null,
          error: error || new Error('No active window found'),
        };
      }

      return {
        window: {
          start_time: this.formatWindowTime(window).split(' - ')[0],
          end_time: this.formatWindowTime(window).split(' - ')[1],
        },
        error: null,
      };
    } catch (err) {
      return {
        window: null,
        error: err instanceof Error ? err : new Error('Failed to get window'),
      };
    }
  },

  /**
   * Get attendance window display string
   * Formats time for display (e.g., "09:30 AM - 11:30 AM")
   */
  formatWindowTime(window: AttendanceWindow): string {
    const formatTime = (timeString: string) => {
      const [hour, minute] = timeString.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(window.start_time)} - ${formatTime(window.end_time)}`;
  },
};
