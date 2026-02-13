// Supabase Edge Function to send notifications
// Deploy with: supabase functions deploy send-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  slotNumber: number;
  slotTime: string;
  presentCount: number;
  lateCount: number;
  totalCount: number;
  attendanceRate: number;
  triggeredBy: string;
  isManual: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const request: NotificationRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get enabled contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('notification_contacts')
      .select('*')
      .eq('is_enabled', true)

    if (contactsError) throw contactsError

    if (!contacts || contacts.length === 0) {
      throw new Error('No enabled contacts found')
    }

    // Prepare notification data
    const notificationData = {
      date: new Date().toISOString().split('T')[0],
      slotNumber: request.slotNumber,
      slotTime: request.slotTime,
      presentCount: request.presentCount,
      lateCount: request.lateCount,
      totalCount: request.totalCount,
      attendanceRate: request.attendanceRate,
    }

    // Generate SMS content
    const dateFormatted = new Date(notificationData.date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short' 
    })
    const smsContent = `Slot ${notificationData.slotNumber} (${notificationData.slotTime}): ${notificationData.presentCount} present, ${notificationData.lateCount} late, ${notificationData.totalCount} total. Rate: ${notificationData.attendanceRate}%. ${dateFormatted}`

    // Get API keys from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    let emailsSent = 0
    let smsSent = 0
    let emailsFailed = 0
    let smsFailed = 0

    // Send emails using Resend
    if (resendApiKey) {
      for (const contact of contacts) {
        if (contact.email) {
          try {
            const emailHtml = generateEmailHTML(notificationData)
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Attendance System <onboarding@resend.dev>',
                to: [contact.email],
                subject: `Attendance Report - Slot ${notificationData.slotNumber} (${notificationData.slotTime})`,
                html: emailHtml,
              }),
            })

            const result = await response.json()

            if (response.ok) {
              emailsSent++
              // Log success
              await supabase.from('notification_history').insert({
                slot_number: request.slotNumber,
                slot_time: request.slotTime,
                notification_date: notificationData.date,
                recipient_email: contact.email,
                notification_type: 'email',
                status: 'success',
                message_id: result.id,
                attendance_data: notificationData,
                triggered_by: request.triggeredBy,
                is_manual: request.isManual,
              })
            } else {
              emailsFailed++
              // Log failure
              await supabase.from('notification_history').insert({
                slot_number: request.slotNumber,
                slot_time: request.slotTime,
                notification_date: notificationData.date,
                recipient_email: contact.email,
                notification_type: 'email',
                status: 'failed',
                error_message: result.message || 'Unknown error',
                attendance_data: notificationData,
                triggered_by: request.triggeredBy,
                is_manual: request.isManual,
              })
            }
          } catch (error) {
            emailsFailed++
            console.error('Email error:', error)
          }
        }
      }
    }

    // Send SMS using Twilio
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
      
      for (const contact of contacts) {
        if (contact.phone) {
          try {
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${twilioAuth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  To: contact.phone,
                  From: twilioPhoneNumber,
                  Body: smsContent,
                }).toString(),
              }
            )

            const result = await response.json()

            if (response.ok) {
              smsSent++
              // Log success
              await supabase.from('notification_history').insert({
                slot_number: request.slotNumber,
                slot_time: request.slotTime,
                notification_date: notificationData.date,
                recipient_phone: contact.phone,
                notification_type: 'sms',
                status: 'success',
                message_id: result.sid,
                attendance_data: notificationData,
                triggered_by: request.triggeredBy,
                is_manual: request.isManual,
              })
            } else {
              smsFailed++
              // Log failure
              await supabase.from('notification_history').insert({
                slot_number: request.slotNumber,
                slot_time: request.slotTime,
                notification_date: notificationData.date,
                recipient_phone: contact.phone,
                notification_type: 'sms',
                status: 'failed',
                error_message: result.message || 'Unknown error',
                attendance_data: notificationData,
                triggered_by: request.triggeredBy,
                is_manual: request.isManual,
              })
            }
          } catch (error) {
            smsFailed++
            console.error('SMS error:', error)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        smsSent,
        emailsFailed,
        smsFailed,
        totalContacts: contacts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateEmailHTML(data: any): string {
  const dateFormatted = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">📊 Attendance Report</h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">${dateFormatted}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #f8fafc; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 4px 0; color: #1e293b; font-size: 18px;">Time Slot ${data.slotNumber}</h2>
                <p style="margin: 0; color: #64748b; font-size: 14px;">${data.slotTime}</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
                    <div style="text-align: center;">
                      <div style="font-size: 32px; font-weight: 700; color: #16a34a;">${data.presentCount}</div>
                      <div style="font-size: 12px; color: #15803d; text-transform: uppercase;">Present</div>
                    </div>
                  </td>
                  <td width="10"></td>
                  <td width="50%" style="padding: 16px; background-color: #fef3c7; border-radius: 8px;">
                    <div style="text-align: center;">
                      <div style="font-size: 32px; font-weight: 700; color: #d97706;">${data.lateCount}</div>
                      <div style="font-size: 12px; color: #b45309; text-transform: uppercase;">Late</div>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Total Attendance</div>
                <div style="font-size: 36px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">${data.totalCount}</div>
                <div style="display: inline-block; padding: 8px 16px; background-color: ${data.attendanceRate >= 90 ? '#16a34a' : data.attendanceRate >= 75 ? '#d97706' : '#dc2626'}; color: #ffffff; border-radius: 20px; font-size: 16px; font-weight: 600;">
                  ${data.attendanceRate}% Attendance Rate
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                This is an automated notification from the Attendance Management System.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
