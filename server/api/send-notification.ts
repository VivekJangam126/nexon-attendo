/**
 * API Route for sending notifications
 * This runs on the Vite dev server (Node.js environment)
 */

import type { Request, Response } from 'express';

// This will be called by Vite's server
export default async function handler(req: Request, res: Response) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Dynamic import to avoid bundling with frontend
    const { notificationService } = await import('../services/notification.service');
    const { notificationSettingsService } = await import('../services/notification-settings.service');
    const { supabase } = await import('../supabase/client');

    const request = req.body;

    // Get enabled contacts
    const { contacts, error: contactsError } = await notificationSettingsService.getEnabledContacts();
    
    if (contactsError) {
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      throw new Error('No enabled contacts found');
    }

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
    const employeeDetails = attendanceRecords
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
      .filter((detail: any) => detail != null) || [];

    // Prepare notification data
    const notificationData = {
      date: new Date().toISOString().split('T')[0],
      slotNumber: request.slotNumber,
      slotTime: request.slotTime,
      presentCount: request.presentCount,
      lateCount: request.lateCount,
      totalCount: request.totalCount,
      attendanceRate: request.attendanceRate,
      isManual: request.isManual || true,
      employeeDetails,
      actualStartTime: request.actualStartTime,
      actualEndTime: request.actualEndTime,
    };

    // Prepare recipients
    const recipients = contacts.map((contact: any) => ({
      name: contact.name,
      email: contact.email || undefined,
      phone: contact.phone || undefined,
    }));

    // Send notifications
    const results = await notificationService.sendBulkNotifications(recipients, notificationData);

    // Count successes and failures
    let emailsSent = 0;
    let emailsFailed = 0;
    let smsSent = 0;
    let smsFailed = 0;

    // Process email results
    for (const result of results.emailResults) {
      if (result.result.success) {
        emailsSent++;
      } else {
        emailsFailed++;
      }

      // Log to history
      await notificationSettingsService.logNotification(
        request.slotNumber,
        request.slotTime,
        notificationData.date,
        result.recipient,
        null,
        'email',
        result.result.success ? 'success' : 'failed',
        result.result.messageId || null,
        result.result.error || null,
        notificationData,
        request.triggeredBy,
        request.isManual || true
      );
    }

    // Process SMS results
    for (const result of results.smsResults) {
      if (result.result.success) {
        smsSent++;
      } else {
        smsFailed++;
      }

      // Log to history
      await notificationSettingsService.logNotification(
        request.slotNumber,
        request.slotTime,
        notificationData.date,
        null,
        result.recipient,
        'sms',
        result.result.success ? 'success' : 'failed',
        result.result.messageId || null,
        result.result.error || null,
        notificationData,
        request.triggeredBy,
        request.isManual || true
      );
    }

    res.status(200).json({
      success: true,
      emailsSent,
      smsSent,
      emailsFailed,
      smsFailed,
      totalContacts: contacts.length,
    });
  } catch (error: any) {
    console.error('Notification API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notifications',
    });
  }
}
