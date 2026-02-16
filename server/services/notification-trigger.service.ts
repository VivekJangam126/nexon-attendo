/**
 * Notification Trigger Service
 * Handles notification trigger requests via Supabase Edge Function
 */

import { supabase } from '../supabase/client';
import { notificationSettingsService } from './notification-settings.service';

export interface EmployeeAttendanceDetail {
  name: string;
  checkInTime: string; // Formatted time like "10:05 AM"
  status: 'present' | 'late';
}

export interface TriggerNotificationRequest {
  slotNumber: 1 | 2 | 3;
  slotTime: string;
  presentCount: number;
  lateCount: number;
  totalCount: number;
  attendanceRate: number;
  triggeredBy: string;
  employeeDetails?: EmployeeAttendanceDetail[];
  actualStartTime?: string;
  actualEndTime?: string;
}

export interface TriggerNotificationResponse {
  success: boolean;
  emailsSent: number;
  smsSent: number;
  emailsFailed: number;
  smsFailed: number;
  message: string;
  error: Error | null;
}

export const notificationTriggerService = {
  /**
   * Trigger notification via Supabase Edge Function
   */
  async triggerNotification(
    request: TriggerNotificationRequest
  ): Promise<TriggerNotificationResponse> {
    try {
      // Check if contacts exist
      const { contacts, error: contactsError } = await notificationSettingsService.getEnabledContacts();
      
      if (contactsError) {
        throw contactsError;
      }

      if (contacts.length === 0) {
        throw new Error('No enabled contacts found. Please add HR contacts in notification settings.');
      }

      // Get attendance window settings to determine start time
      const { data: windowSettings } = await supabase
        .from('attendance_settings')
        .select('start_time')
        .eq('setting_name', 'default_attendance_window')
        .single();

      const startTime = (windowSettings as any)?.start_time || '10:00:00';
      
      // Format start time (e.g., "10:00 AM")
      const [startHour, startMinute] = startTime.split(':');
      const startH = parseInt(startHour);
      const startPeriod = startH >= 12 ? 'PM' : 'AM';
      const startDisplayHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH;
      const actualStartTime = `${startDisplayHour}:${startMinute} ${startPeriod}`;

      // Get current time for end time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const endPeriod = currentHour >= 12 ? 'PM' : 'AM';
      const endDisplayHour = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
      const actualEndTime = `${endDisplayHour}:${currentMinute.toString().padStart(2, '0')} ${endPeriod}`;

      // Get today's attendance with employee names and check-in times
      const today = new Date().toISOString().split('T')[0];
      
      // First get attendance records
      const { data: attendanceRecords, error: attError } = await supabase
        .from('attendance')
        .select('user_id, status, check_in_time')
        .eq('date', today)
        .in('status', ['present', 'late'])
        .order('check_in_time', { ascending: true });

      if (attError) {
        console.error('Error fetching attendance:', attError);
      }

      // Get user profiles separately
      const userIds = attendanceRecords?.map((a: any) => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Map profiles to attendance
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || []);

      // Format employee details with check-in times
      const employeeDetails: EmployeeAttendanceDetail[] = attendanceRecords
        ?.map((record: any) => {
          const name = profileMap.get(record.user_id);
          if (!name) return null;
          
          // Format check-in time
          const checkInDate = new Date(record.check_in_time);
          const hour = checkInDate.getHours();
          const minute = checkInDate.getMinutes();
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const formattedTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
          
          return {
            name,
            checkInTime: formattedTime,
            status: record.status,
          };
        })
        .filter((detail: EmployeeAttendanceDetail | null) => detail != null) || [];

      // Call Supabase Edge Function without auth headers
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-notification', {
        body: {
          ...request,
          isManual: true,
          employeeDetails,
          actualStartTime,
          actualEndTime,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (functionError) {
        throw functionError;
      }

      const data = functionData;

      if (!data || data.success === false) {
        throw new Error(data?.error || 'Failed to send notifications');
      }

      return {
        success: true,
        emailsSent: data.emailsSent || 0,
        smsSent: data.smsSent || 0,
        emailsFailed: data.emailsFailed || 0,
        smsFailed: data.smsFailed || 0,
        message: `Sent to ${data.totalContacts} contact(s)`,
        error: null,
      };
    } catch (err) {
      console.error('Failed to trigger notification:', err);
      return {
        success: false,
        emailsSent: 0,
        smsSent: 0,
        emailsFailed: 0,
        smsFailed: 0,
        message: err instanceof Error ? err.message : 'Failed to send notifications',
        error: err instanceof Error ? err : new Error('Failed to trigger notification'),
      };
    }
  },

  /**
   * Get current attendance data for notification
   */
  async getCurrentAttendanceData(): Promise<{
    presentCount: number;
    lateCount: number;
    totalCount: number;
    attendanceRate: number;
    error: Error | null;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      const presentCount = attendanceData?.filter((a: any) => a.status === 'present').length || 0;
      const lateCount = attendanceData?.filter((a: any) => a.status === 'late').length || 0;
      const totalCount = presentCount + lateCount;
      const attendanceRate = totalCount > 0 ? Math.round((totalCount / (attendanceData?.length || 1)) * 100) : 0;

      return {
        presentCount,
        lateCount,
        totalCount,
        attendanceRate,
        error: null,
      };
    } catch (err) {
      return {
        presentCount: 0,
        lateCount: 0,
        totalCount: 0,
        attendanceRate: 0,
        error: err instanceof Error ? err : new Error('Failed to fetch attendance data'),
      };
    }
  },
};
