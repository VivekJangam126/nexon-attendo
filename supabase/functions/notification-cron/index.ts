// Supabase Edge Function for automatic notification scheduling
// Deploy with: supabase functions deploy notification-cron
// Set up cron: Use Supabase Dashboard -> Edge Functions -> notification-cron -> Add Cron Schedule

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    console.log('Notification cron job started')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time in IST
    const now = new Date()
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const currentHour = istTime.getHours()
    const currentMinute = istTime.getMinutes()
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`

    console.log('Current IST time:', currentTimeString)

    // Check if today is a working day (Monday-Friday)
    const dayOfWeek = istTime.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Weekend - skipping notifications')
      return new Response(JSON.stringify({ message: 'Weekend - no notifications sent' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Get enabled notification slots that match current time
    const { data: slots, error: slotsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('is_enabled', true)
      .eq('slot_time', currentTimeString)

    if (slotsError) throw slotsError

    if (!slots || slots.length === 0) {
      console.log('No enabled slots for current time')
      return new Response(JSON.stringify({ message: 'No slots scheduled for this time' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Found ${slots.length} slot(s) to process`)

    // Get today's attendance data
    const today = istTime.toISOString().split('T')[0]
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today)

    if (attendanceError) throw attendanceError

    const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0
    const lateCount = attendanceData?.filter(a => a.status === 'late').length || 0
    const totalCount = presentCount + lateCount
    const attendanceRate = totalCount > 0 ? Math.round((totalCount / (attendanceData?.length || 1)) * 100) : 0

    console.log('Attendance data:', { presentCount, lateCount, totalCount, attendanceRate })

    // Process each slot
    const results = []
    for (const slot of slots) {
      // Format slot time
      const [hour, minute] = slot.slot_time.split(':')
      const h = parseInt(hour)
      const period = h >= 12 ? 'PM' : 'AM'
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
      const slotTimeFormatted = `${displayHour}:${minute} ${period}`

      // Call send-notification function
      const functionUrl = `${supabaseUrl}/functions/v1/send-notification`
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotNumber: slot.slot_number,
          slotTime: slotTimeFormatted,
          presentCount,
          lateCount,
          totalCount,
          attendanceRate,
          triggeredBy: 'system-cron',
          isManual: false,
        }),
      })

      const result = await response.json()
      results.push({
        slot: slot.slot_number,
        time: slotTimeFormatted,
        result,
      })

      console.log(`Slot ${slot.slot_number} processed:`, result)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${slots.length} slot(s)`,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Cron job error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
