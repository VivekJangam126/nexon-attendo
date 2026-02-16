/**
 * Vercel Serverless Function for Sending Notifications
 * This replaces the Vite middleware for production deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { notificationService } from '../server/services/notification.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestData = req.body;

    // Validate required fields
    if (!requestData.slotNumber || !requestData.slotTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Get enabled contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('notification_contacts')
      .select('*')
      .eq('is_enabled', true);

    if (contactsError) {
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ error: 'No enabled contacts found' });
    }

    // Prepare notification data
    const notificationData = {
      date: new Date().toISOString().split('T')[0],
      slotNumber: requestData.slotNumber,
      slotTime: requestData.slotTime,
      presentCount: requestData.presentCount || 0,
      lateCount: requestData.lateCount || 0,
      totalCount: requestData.totalCount || 0,
      attendanceRate: requestData.attendanceRate || 0,
      isManual: requestData.isManual || true,
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
      await supabase.from('notification_history').insert({
        slot_number: requestData.slotNumber,
        slot_time: requestData.slotTime,
        notification_date: notificationData.date,
        recipient_email: result.recipient,
        notification_type: 'email',
        status: result.result.success ? 'success' : 'failed',
        message_id: result.result.messageId || null,
        error_message: result.result.error || null,
        attendance_data: notificationData,
        triggered_by: requestData.triggeredBy || 'manual',
        is_manual: requestData.isManual || true,
      });
    }

    // Process SMS results
    for (const result of results.smsResults) {
      if (result.result.success) {
        smsSent++;
      } else {
        smsFailed++;
      }

      // Log to history
      await supabase.from('notification_history').insert({
        slot_number: requestData.slotNumber,
        slot_time: requestData.slotTime,
        notification_date: notificationData.date,
        recipient_phone: result.recipient,
        notification_type: 'sms',
        status: result.result.success ? 'success' : 'failed',
        message_id: result.result.messageId || null,
        error_message: result.result.error || null,
        attendance_data: notificationData,
        triggered_by: requestData.triggeredBy || 'manual',
        is_manual: requestData.isManual || true,
      });
    }

    return res.status(200).json({
      success: true,
      emailsSent,
      smsSent,
      emailsFailed,
      smsFailed,
      totalContacts: contacts.length,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notifications',
    });
  }
}
