/**
 * Notification Trigger Service
 * Handles notification trigger requests via Supabase Edge Function
 */

import { supabase } from '../supabase/client';
import { notificationSettingsService } from './notification-settings.service';

export interface TriggerNotificationRequest {
  slotNumber: 1 | 2 | 3;
  slotTime: string;
  presentCount: number;
  lateCount: number;
  totalCount: number;
  attendanceRate: number;
  triggeredBy: string;
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
   * Trigger notification via API endpoint
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

      // Call API endpoint
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          isManual: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send notifications';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send notifications');
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

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const lateCount = attendanceData?.filter(a => a.status === 'late').length || 0;
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
