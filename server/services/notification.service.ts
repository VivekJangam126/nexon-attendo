/**
 * Notification Service
 * Handles SMS and Email notifications for attendance reports
 * Uses Resend for email and Twilio for SMS
 */

import { Resend } from 'resend';
import twilio from 'twilio';

// Lazy initialization of clients (only when needed)
let resendClient: Resend | null = null;
let twilioClient: ReturnType<typeof twilio> | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured in environment variables');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getTwilioClient(): ReturnType<typeof twilio> {
  if (!twilioClient) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured in environment variables');
    }
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

export interface AttendanceNotificationData {
  date: string;
  slotNumber: 1 | 2 | 3;
  slotTime: string;
  presentCount: number;
  lateCount: number;
  totalCount: number;
  attendanceRate: number;
  isManual?: boolean; // Flag to indicate manual trigger by admin
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const notificationService = {
  /**
   * Send email notification using Resend
   */
  async sendEmailNotification(
    to: string,
    data: AttendanceNotificationData
  ): Promise<NotificationResult> {
    try {
      console.log('📧 [EMAIL] Sending to:', to);
      console.log('📧 [EMAIL] Data:', data);

      const htmlContent = this.generateEmailHTML(data);
      const subject = `Attendance Report - Slot ${data.slotNumber} (${data.slotTime})`;

      const resend = getResendClient();
      const response = await resend.emails.send({
        from: 'Attendance System <onboarding@resend.dev>',
        to: [to],
        subject,
        html: htmlContent,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('✅ [EMAIL] Sent successfully:', response.data?.id);

      return {
        success: true,
        messageId: response.data?.id || 'unknown',
      };
    } catch (error) {
      console.error('❌ [EMAIL] Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Send SMS notification using Twilio
   */
  async sendSMSNotification(
    to: string,
    data: AttendanceNotificationData
  ): Promise<NotificationResult> {
    try {
      console.log('📱 [SMS] Sending to:', to);
      console.log('📱 [SMS] Data:', data);

      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('TWILIO_PHONE_NUMBER not configured in environment variables');
      }

      const messageBody = this.generateSMSContent(data);

      const client = getTwilioClient();
      const message = await client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });

      console.log('✅ [SMS] Sent successfully. SID:', message.sid);
      console.log('✅ [SMS] Status:', message.status);

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      console.error('❌ [SMS] Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Send notification with retry logic
   * Attempts once, then retries after 5 minutes if failed
   */
  async sendWithRetry(
    type: 'email' | 'sms',
    to: string,
    data: AttendanceNotificationData,
    retryCount: number = 0
  ): Promise<NotificationResult> {
    const sendFunction = type === 'email' 
      ? this.sendEmailNotification.bind(this)
      : this.sendSMSNotification.bind(this);

    const result = await sendFunction(to, data);

    if (!result.success && retryCount === 0) {
      console.log(`⏳ [${type.toUpperCase()}] Scheduling retry in 5 minutes...`);
      
      // Schedule retry after 5 minutes
      setTimeout(async () => {
        console.log(`🔄 [${type.toUpperCase()}] Retrying...`);
        await this.sendWithRetry(type, to, data, 1);
      }, 5 * 60 * 1000);
    }

    return result;
  },

  /**
   * Send notifications to multiple recipients
   * Email failures don't block SMS, and vice versa
   */
  async sendBulkNotifications(
    recipients: Array<{ email?: string; phone?: string; name: string }>,
    data: AttendanceNotificationData
  ): Promise<{
    emailResults: Array<{ recipient: string; result: NotificationResult }>;
    smsResults: Array<{ recipient: string; result: NotificationResult }>;
  }> {
    const emailResults: Array<{ recipient: string; result: NotificationResult }> = [];
    const smsResults: Array<{ recipient: string; result: NotificationResult }> = [];

    // Send emails (don't block on failures)
    for (const recipient of recipients) {
      if (recipient.email) {
        try {
          const result = await this.sendWithRetry('email', recipient.email, data);
          emailResults.push({ recipient: recipient.email, result });
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          emailResults.push({
            recipient: recipient.email,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    }

    // Send SMS (don't block on failures)
    for (const recipient of recipients) {
      if (recipient.phone) {
        try {
          const result = await this.sendWithRetry('sms', recipient.phone, data);
          smsResults.push({ recipient: recipient.phone, result });
        } catch (error) {
          console.error(`Failed to send SMS to ${recipient.phone}:`, error);
          smsResults.push({
            recipient: recipient.phone,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    }

    return { emailResults, smsResults };
  },

  /**
   * Generate SMS content (under 160 characters)
   */
  generateSMSContent(data: AttendanceNotificationData): string {
    const { date, slotNumber, slotTime, presentCount, lateCount, totalCount, attendanceRate, isManual } = data;
    
    const dateFormatted = new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short' 
    });
    
    // Manual alert: shorter, indicates admin sent it
    if (isManual) {
      return `[ADMIN ALERT] ${dateFormatted} ${slotTime}: ${presentCount} present, ${lateCount} late. Total: ${totalCount} (${attendanceRate}%)`;
    }
    
    // Automatic alert: standard format
    return `Slot ${slotNumber} (${slotTime}): ${presentCount} present, ${lateCount} late, ${totalCount} total. Rate: ${attendanceRate}%. ${dateFormatted}`;
  },

  /**
   * Generate HTML email content
   */
  generateEmailHTML(data: AttendanceNotificationData): string {
    const { date, slotNumber, slotTime, presentCount, lateCount, totalCount, attendanceRate, isManual } = data;
    
    const dateFormatted = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const headerTitle = isManual ? '🚨 Manual Alert - Attendance Report' : '📊 Attendance Report';
    const headerColor = isManual ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const manualBadge = isManual ? `
      <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
        <span style="color: #dc2626; font-weight: 600; font-size: 14px;">⚠️ MANUAL ALERT SENT BY ADMIN</span>
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: ${headerColor}; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${headerTitle}
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                ${dateFormatted}
              </p>
            </td>
          </tr>
          
          <!-- Slot Info -->
          <tr>
            <td style="padding: 30px;">
              ${manualBadge}
              <div style="background-color: #f8fafc; border-left: 4px solid ${isManual ? '#dc2626' : '#667eea'}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 4px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                  Time Slot ${slotNumber}
                </h2>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  ${slotTime}
                </p>
              </div>
              
              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; vertical-align: top;">
                    <div style="text-align: center;">
                      <div style="font-size: 32px; font-weight: 700; color: #16a34a; margin-bottom: 4px;">
                        ${presentCount}
                      </div>
                      <div style="font-size: 12px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">
                        Present
                      </div>
                    </div>
                  </td>
                  <td width="10"></td>
                  <td width="50%" style="padding: 16px; background-color: #fef3c7; border-radius: 8px; vertical-align: top;">
                    <div style="text-align: center;">
                      <div style="font-size: 32px; font-weight: 700; color: #d97706; margin-bottom: 4px;">
                        ${lateCount}
                      </div>
                      <div style="font-size: 12px; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">
                        Late
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Total & Rate -->
              <div style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
                  Total Attendance
                </div>
                <div style="font-size: 36px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">
                  ${totalCount}
                </div>
                <div style="display: inline-block; padding: 8px 16px; background-color: ${attendanceRate >= 90 ? '#16a34a' : attendanceRate >= 75 ? '#d97706' : '#dc2626'}; color: #ffffff; border-radius: 20px; font-size: 16px; font-weight: 600;">
                  ${attendanceRate}% Attendance Rate
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                ${isManual 
                  ? 'This alert was manually triggered by an administrator.' 
                  : 'This is an automated notification from the Attendance Management System.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  },
};
