// Supabase Edge Function to send notifications
// Deploy with: supabase functions deploy send-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmployeeAttendanceDetail {
  name: string;
  checkInTime: string;
  status: 'present' | 'late';
}

interface NotificationRequest {
  slotNumber: number;
  slotTime: string;
  slotStartTime?: string; // For slot alerts (e.g., "10:00 AM")
  slotEndTime?: string; // For slot alerts (e.g., "10:10 AM")
  presentCount: number;
  lateCount: number;
  absentCount?: number;
  totalCount: number;
  totalEmployees?: number;
  attendanceRate: number;
  triggeredBy: string;
  isManual: boolean;
  employeeDetails?: EmployeeAttendanceDetail[]; // For manual and automatic alerts
  actualStartTime?: string; // For manual alerts (e.g., "10:00 AM")
  actualEndTime?: string; // For manual alerts (e.g., "02:30 PM")
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📨 Notification request received');
    
    // Get request body
    const request: NotificationRequest = await req.json()
    console.log('📋 Request data:', { 
      slotNumber: request.slotNumber, 
      totalCount: request.totalCount,
      isManual: request.isManual 
    });

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Fetching enabled contacts...');
    
    // Get enabled contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('notification_contacts')
      .select('*')
      .eq('is_enabled', true)

    if (contactsError) throw contactsError

    if (!contacts || contacts.length === 0) {
      console.log('⚠️  No enabled contacts found');
      throw new Error('No enabled contacts found')
    }
    
    console.log(`✅ Found ${contacts.length} enabled contact(s)`);

    // Prepare notification data
    const notificationData = {
      date: new Date().toISOString().split('T')[0],
      slotNumber: request.slotNumber,
      slotTime: request.slotTime,
      presentCount: request.presentCount,
      lateCount: request.lateCount,
      absentCount: request.absentCount || 0,
      totalCount: request.totalCount,
      totalEmployees: request.totalEmployees || request.totalCount,
      attendanceRate: request.attendanceRate,
    }

    // Generate SMS and WhatsApp content
    const dateFormatted = new Date(notificationData.date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short' 
    })
    
    // SMS Content - Show full employee list with proper formatting
    let smsContent: string
    if (request.isManual) {
      const timeRange = request.actualStartTime && request.actualEndTime 
        ? `${request.actualStartTime} to ${request.actualEndTime}`
        : notificationData.slotTime
      
      let employeeList = ''
      if (request.employeeDetails && request.employeeDetails.length > 0) {
        employeeList = '\n' + request.employeeDetails
          .map((emp, index) => `${index + 1}. ${emp.name} - ${emp.checkInTime}${emp.status === 'late' ? ' (Late)' : ''}`)
          .join('\n')
      }
      
      smsContent = `📊 *ATTENDANCE ALERT*\n${dateFormatted} | ${timeRange}\n\nPresent: ${notificationData.presentCount} | Late: ${notificationData.lateCount} | Absent: ${notificationData.absentCount}\nTotal: ${notificationData.totalEmployees} | Rate: ${notificationData.attendanceRate}%${employeeList}`
    } else {
      const slotTimeRange = request.slotStartTime && request.slotEndTime
        ? `${request.slotStartTime} to ${request.slotEndTime}`
        : notificationData.slotTime
      
      let employeeList = ''
      if (request.employeeDetails && request.employeeDetails.length > 0) {
        employeeList = '\n' + request.employeeDetails
          .map((emp, index) => `${index + 1}. ${emp.name} - ${emp.checkInTime}${emp.status === 'late' ? ' (Late)' : ''}`)
          .join('\n')
      }
      
      smsContent = `📊 *SLOT-${notificationData.slotNumber} ATTENDANCE*\n${dateFormatted} | ${slotTimeRange}\n\nPresent: ${notificationData.presentCount} | Late: ${notificationData.lateCount} | Absent: ${notificationData.absentCount}\nTotal: ${notificationData.totalEmployees} | Rate: ${notificationData.attendanceRate}%${employeeList}`
    }

    // WhatsApp Content - FULL list (up to 1500 characters)
    let whatsappContent: string
    if (request.isManual) {
      const timeRange = request.actualStartTime && request.actualEndTime 
        ? `${request.actualStartTime} to ${request.actualEndTime}`
        : notificationData.slotTime
      
      let employeeList = ''
      if (request.employeeDetails && request.employeeDetails.length > 0) {
        employeeList = '\n\n' + request.employeeDetails
          .map((emp, index) => `${index + 1}. ${emp.name} - ${emp.checkInTime}${emp.status === 'late' ? ' (Late)' : ''}`)
          .join('\n')
        
        // Truncate if exceeds 1500 characters
        const baseMessage = `📊 *ATTENDANCE ALERT*\n${dateFormatted} | ${timeRange}\n\nPresent: ${notificationData.presentCount} | Late: ${notificationData.lateCount} | Absent: ${notificationData.absentCount}\nTotal: ${notificationData.totalEmployees} | Rate: ${notificationData.attendanceRate}%`
        
        if ((baseMessage + employeeList).length > 1500) {
          // Calculate how many employees we can fit
          let truncatedList = ''
          let count = 0
          for (const emp of request.employeeDetails) {
            const line = `\n${count + 1}. ${emp.name} - ${emp.checkInTime}${emp.status === 'late' ? ' (Late)' : ''}`
            if ((baseMessage + truncatedList + line + '\n...').length > 1500) break
            truncatedList += line
            count++
          }
          employeeList = truncatedList + `\n... +${request.employeeDetails.length - count} more`
        }
        
        whatsappContent = baseMessage + employeeList
      } else {
        whatsappContent = `📊 *ATTENDANCE ALERT*\n${dateFormatted} | ${timeRange}\n\nPresent: ${notificationData.presentCount} | Late: ${notificationData.lateCount} | Absent: ${notificationData.absentCount}\nTotal: ${notificationData.totalEmployees} | Rate: ${notificationData.attendanceRate}%`
      }
    } else {
      const slotTimeRange = request.slotStartTime && request.slotEndTime
        ? `${request.slotStartTime} to ${request.slotEndTime}`
        : notificationData.slotTime
      
      let employeeList = ''
      if (request.employeeDetails && request.employeeDetails.length > 0) {
        employeeList = '\n\n' + request.employeeDetails
          .map((emp, index) => `${index + 1}. ${emp.name} - ${emp.checkInTime}${emp.status === 'late' ? ' (Late)' : ''}`)
          .join('\n')
        
        // Truncate if exceeds 1500 characters
        const baseMessage = `📊 *SLOT-${notificationData.slotNumber} REPORT*\n${dateFormatted} | ${slotTimeRange}\n\nPresent: ${notificationData.presentCount} | Late: ${notificationData.lateCount} | Absent: ${notificationData.absentCount}\nTotal: ${notificationData.totalEmployees} | Rate: ${notificationData.attendanceRate}%`
        
        if ((baseMessage + employeeList).length > 1500) {
          // Calculate how many employees we can fit
          let truncatedList = ''
          let count = 0
          for (const emp of request.employeeDetails) {
            const line = `\n${count + 1}. ${emp.name} - ${emp.checkInTime}${emp.status === 'late' ? ' (Late)' : ''}`
            if ((baseMessage + truncatedList + line + '\n...').length > 1500) break
            truncatedList += line
            count++
          }
          employeeList = truncatedList + `\n... +${request.employeeDetails.length - count} more`
        }
        
        whatsappContent = baseMessage + employeeList
      } else {
        whatsappContent = `📊 *SLOT-${notificationData.slotNumber} REPORT*\n${dateFormatted} | ${slotTimeRange}\n\nPresent: ${notificationData.presentCount} | Late: ${notificationData.lateCount} | Absent: ${notificationData.absentCount}\nTotal: ${notificationData.totalEmployees} | Rate: ${notificationData.attendanceRate}%`
      }
    }

    // Get API keys from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // e.g., whatsapp:+14155238886

    console.log('🔑 API Keys status:');
    console.log('  Resend:', resendApiKey ? '✅ Set' : '❌ Missing');
    console.log('  Twilio SID:', twilioAccountSid ? '✅ Set' : '❌ Missing');
    console.log('  Twilio Token:', twilioAuthToken ? '✅ Set' : '❌ Missing');
    console.log('  Twilio Phone:', twilioPhoneNumber ? '✅ Set' : '❌ Missing');
    console.log('  Twilio WhatsApp:', twilioWhatsAppNumber ? '✅ Set' : '❌ Missing');

    let emailsSent = 0
    let smsSent = 0
    let emailsFailed = 0
    let smsFailed = 0
    let whatsappSent = 0
    let whatsappFailed = 0

    console.log('\n📧 Starting email notifications...');

    // Send emails using Resend
    if (resendApiKey) {
      for (const contact of contacts) {
        if (contact.email) {
          try {
            const emailHtml = generateEmailHTML({
              ...notificationData,
              slotStartTime: request.slotStartTime,
              slotEndTime: request.slotEndTime,
            }, request.isManual, request.employeeDetails, request.actualStartTime, request.actualEndTime)
            const emailSubject = request.isManual 
              ? `[Manual Alert] Attendance Report - ${request.actualStartTime || notificationData.slotTime} to ${request.actualEndTime || 'Now'}`
              : `Slot ${notificationData.slotNumber} Report - ${notificationData.slotTime} (${notificationData.attendanceRate}%)`
            
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Attendance System <onboarding@resend.dev>',
                to: [contact.email],
                subject: emailSubject,
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

    console.log('\n📱 Starting WhatsApp notifications...');
    console.log('⚠️  NOTE: WhatsApp has 24-hour messaging window limitation');
    console.log('   Messages will only work if recipient messaged you in last 24 hours');
    console.log('   For production, use WhatsApp Message Templates instead');

    // Send WhatsApp messages using Twilio
    // NOTE: WhatsApp Business API has a 24-hour messaging window
    // Freeform messages only work within 24 hours of user's last message
    // For production use, implement WhatsApp Message Templates
    if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
      const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
      
      for (const contact of contacts) {
        if (contact.phone) {
          try {
            // Format phone number for WhatsApp (must include whatsapp: prefix)
            const whatsappTo = contact.phone.startsWith('whatsapp:') 
              ? contact.phone 
              : `whatsapp:${contact.phone}`
            
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${twilioAuth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  To: whatsappTo,
                  From: twilioWhatsAppNumber,
                  Body: whatsappContent, // Full employee list for WhatsApp
                }).toString(),
              }
            )

            const result = await response.json()

            if (response.ok) {
              whatsappSent++
              console.log(`✅ WhatsApp sent to ${contact.phone}`);
              // Log success
              await supabase.from('notification_history').insert({
                slot_number: request.slotNumber,
                slot_time: request.slotTime,
                notification_date: notificationData.date,
                recipient_phone: contact.phone,
                notification_type: 'whatsapp',
                status: 'success',
                message_id: result.sid,
                attendance_data: notificationData,
                triggered_by: request.triggeredBy,
                is_manual: request.isManual,
              })
            } else {
              whatsappFailed++
              // Check if it's the 24-hour window error
              const isWindowError = result.code === 63016 || (result.message && result.message.includes('allowed window'))
              const errorMsg = isWindowError 
                ? 'WhatsApp 24-hour window expired. Use Message Templates for production.'
                : result.message || 'Unknown error'
              
              console.error(`❌ WhatsApp failed for ${contact.phone}:`, errorMsg);
              
              // Log failure with helpful message
              await supabase.from('notification_history').insert({
                slot_number: request.slotNumber,
                slot_time: request.slotTime,
                notification_date: notificationData.date,
                recipient_phone: contact.phone,
                notification_type: 'whatsapp',
                status: 'failed',
                error_message: errorMsg,
                attendance_data: notificationData,
                triggered_by: request.triggeredBy,
                is_manual: request.isManual,
              })
            }
          } catch (error) {
            whatsappFailed++
            console.error('WhatsApp error:', error)
            // Log exception
            await supabase.from('notification_history').insert({
              slot_number: request.slotNumber,
              slot_time: request.slotTime,
              notification_date: notificationData.date,
              recipient_phone: contact.phone,
              notification_type: 'whatsapp',
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              attendance_data: notificationData,
              triggered_by: request.triggeredBy,
              is_manual: request.isManual,
            })
          }
        }
      }
    }

    console.log(`\n✅ Notification complete:`);
    console.log(`  Emails: ${emailsSent} sent, ${emailsFailed} failed`);
    console.log(`  SMS: ${smsSent} sent, ${smsFailed} failed`);
    console.log(`  WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        smsSent,
        whatsappSent,
        emailsFailed,
        smsFailed,
        whatsappFailed,
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

function generateEmailHTML(data: any, isManual: boolean, employeeDetails?: EmployeeAttendanceDetail[], actualStartTime?: string, actualEndTime?: string): string {
  const dateFormatted = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  const triggerBadge = isManual 
    ? '<span style="display: inline-block; padding: 4px 12px; background-color: #f59e0b; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px;">MANUAL</span>'
    : '<span style="display: inline-block; padding: 4px 12px; background-color: #10b981; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px;">AUTO</span>'

  const performanceBadge = !isManual && data.attendanceRate >= 90
    ? '<div style="margin-top: 8px;"><span style="display: inline-block; padding: 6px 16px; background-color: #10b981; color: #ffffff; border-radius: 16px; font-size: 14px; font-weight: 600;">🌟 Excellent Performance!</span></div>'
    : !isManual && data.attendanceRate >= 75
    ? '<div style="margin-top: 8px;"><span style="display: inline-block; padding: 6px 16px; background-color: #3b82f6; color: #ffffff; border-radius: 16px; font-size: 14px; font-weight: 600;">👍 Good Attendance</span></div>'
    : !isManual && data.attendanceRate < 75
    ? '<div style="margin-top: 8px;"><span style="display: inline-block; padding: 6px 16px; background-color: #ef4444; color: #ffffff; border-radius: 16px; font-size: 14px; font-weight: 600;">⚡ Needs Attention</span></div>'
    : ''

  const timeDisplay = isManual && actualStartTime && actualEndTime
    ? `${actualStartTime} to ${actualEndTime}`
    : !isManual && data.slotStartTime && data.slotEndTime
    ? `${data.slotStartTime} to ${data.slotEndTime}`
    : data.slotTime

  const slotTitle = isManual 
    ? `Time Period`
    : `Time Slot ${data.slotNumber}`

  // Generate employee list HTML if available
  let employeeListHtml = ''
  if (employeeDetails && employeeDetails.length > 0) {
    const employeeItems = employeeDetails.map((emp, index) => 
      `<li style="padding: 4px 0; color: #475569;">
        <span style="font-weight: 500;">${index + 1}. ${emp.name}</span> - 
        <span style="color: #64748b;">${emp.checkInTime}</span>
        ${emp.status === 'late' ? '<span style="color: #d97706; font-weight: 600; margin-left: 4px;">(Late)</span>' : ''}
      </li>`
    ).join('')
    
    const listTitle = isManual ? 'Employees Present/Late:' : `Slot ${data.slotNumber} Attendance:`
    
    employeeListHtml = `
      <div style="margin-top: 24px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
        <h3 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">${listTitle}</h3>
        <ul style="margin: 0; padding-left: 20px; list-style-type: decimal; max-height: 400px; overflow-y: auto;">
          ${employeeItems}
        </ul>
      </div>
    `
  }

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
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">📊 Attendance Report ${triggerBadge}</h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">${dateFormatted}</p>
              ${performanceBadge}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #f8fafc; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 4px 0; color: #1e293b; font-size: 18px;">${slotTitle}</h2>
                <p style="margin: 0; color: #64748b; font-size: 14px;">${timeDisplay}</p>
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
              ${employeeListHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                This is ${isManual ? 'a manual' : 'an automated'} notification from the Attendance Management System.
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
