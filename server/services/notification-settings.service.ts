/**
 * Notification Settings Service
 * Manages notification time slots and HR contacts
 */

import { supabase } from '../supabase/client';

export interface NotificationSlot {
  id: string;
  slot_number: 1 | 2 | 3;
  slot_time: string; // HH:MM:SS format
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface NotificationContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface NotificationHistoryRecord {
  id: string;
  slot_number: number;
  slot_time: string;
  notification_date: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  notification_type: 'email' | 'sms';
  status: 'success' | 'failed';
  message_id: string | null;
  error_message: string | null;
  attendance_data: any;
  sent_at: string;
  triggered_by: string | null;
  is_manual: boolean;
  created_at: string;
}

export const notificationSettingsService = {
  /**
   * Get all notification slots
   */
  async getSlots(): Promise<{ slots: NotificationSlot[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('slot_number', { ascending: true });

      if (error) throw error;

      return { slots: data || [], error: null };
    } catch (err) {
      return {
        slots: [],
        error: err instanceof Error ? err : new Error('Failed to fetch notification slots'),
      };
    }
  },

  /**
   * Update notification slot
   */
  async updateSlot(
    slotNumber: 1 | 2 | 3,
    slotTime: string,
    isEnabled: boolean,
    adminId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          slot_time: slotTime,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
          updated_by: adminId,
        })
        .eq('slot_number', slotNumber);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update notification slot'),
      };
    }
  },

  /**
   * Get all notification contacts
   */
  async getContacts(): Promise<{ contacts: NotificationContact[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { contacts: data || [], error: null };
    } catch (err) {
      return {
        contacts: [],
        error: err instanceof Error ? err : new Error('Failed to fetch notification contacts'),
      };
    }
  },

  /**
   * Get enabled notification contacts
   */
  async getEnabledContacts(): Promise<{ contacts: NotificationContact[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_contacts')
        .select('*')
        .eq('is_enabled', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { contacts: data || [], error: null };
    } catch (err) {
      return {
        contacts: [],
        error: err instanceof Error ? err : new Error('Failed to fetch enabled contacts'),
      };
    }
  },

  /**
   * Add notification contact
   */
  async addContact(
    name: string,
    email: string | null,
    phone: string | null,
    adminId: string
  ): Promise<{ success: boolean; contactId?: string; error: Error | null }> {
    try {
      if (!email && !phone) {
        throw new Error('Either email or phone must be provided');
      }

      const { data, error } = await supabase
        .from('notification_contacts')
        .insert({
          name,
          email,
          phone,
          is_enabled: true,
          created_by: adminId,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, contactId: data.id, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to add notification contact'),
      };
    }
  },

  /**
   * Update notification contact
   */
  async updateContact(
    contactId: string,
    name: string,
    email: string | null,
    phone: string | null,
    isEnabled: boolean
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!email && !phone) {
        throw new Error('Either email or phone must be provided');
      }

      const { error } = await supabase
        .from('notification_contacts')
        .update({
          name,
          email,
          phone,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update notification contact'),
      };
    }
  },

  /**
   * Delete notification contact
   */
  async deleteContact(contactId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notification_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to delete notification contact'),
      };
    }
  },

  /**
   * Get recent notification history
   */
  async getRecentHistory(limit: number = 10): Promise<{ history: NotificationHistoryRecord[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { history: data || [], error: null };
    } catch (err) {
      return {
        history: [],
        error: err instanceof Error ? err : new Error('Failed to fetch recent notification history'),
      };
    }
  },

  /**
   * Get notification history
   */
  async getHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ history: NotificationHistoryRecord[]; total: number; error: Error | null }> {
    try {
      // Get total count
      const { count } = await supabase
        .from('notification_history')
        .select('*', { count: 'exact', head: true });

      // Get paginated data
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { history: data || [], total: count || 0, error: null };
    } catch (err) {
      return {
        history: [],
        total: 0,
        error: err instanceof Error ? err : new Error('Failed to fetch notification history'),
      };
    }
  },

  /**
   * Log notification to history
   */
  async logNotification(
    slotNumber: number,
    slotTime: string,
    notificationDate: string,
    recipientEmail: string | null,
    recipientPhone: string | null,
    notificationType: 'email' | 'sms',
    status: 'success' | 'failed',
    messageId: string | null,
    errorMessage: string | null,
    attendanceData: any,
    triggeredBy: string,
    isManual: boolean
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notification_history')
        .insert({
          slot_number: slotNumber,
          slot_time: slotTime,
          notification_date: notificationDate,
          recipient_email: recipientEmail,
          recipient_phone: recipientPhone,
          notification_type: notificationType,
          status,
          message_id: messageId,
          error_message: errorMessage,
          attendance_data: attendanceData,
          triggered_by: triggeredBy,
          is_manual: isManual,
        });

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error('Failed to log notification:', err);
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to log notification'),
      };
    }
  },
};
