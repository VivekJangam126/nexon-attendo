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

    // Get ALL enabled slots to determine time ranges
    const { data: allSlots, error: allSlotsError } = await supabase
      .from('notification_settings')
      .select('slot_number, slot_time')
      .eq('is_enabled', true)
      .order('slot_number', { ascending: true })

    if (allSlotsError) throw allSlotsError

    // Get attendance window start time
    const { data: windowSettings } = await supabase
      .from('attendance_settings')
      .select('start_time')
      .eq('setting_name', 'default_attendance_window')
      .single()

    const attendanceWindowStart = (windowSettings as any)?.start_time || '10:00:00'
    console.log('Attendance window start:', attendanceWindowStart)

    const today = istTime.toISOString().split('T')[0]

    // Process each slot
    const results = []
    for (const slot of slots) {
      // Determine time range for this slot
      let startTime: string
      let startTimeFormatted: string
      
      if (slot.slot_number === 1) {
        // SLOT-1: Use attendance window start
        startTime = attendanceWindowStart
        const [startHour, startMinute] = startTime.split(':')
        const startH = parseInt(startHour)
        const startPeriod = startH >= 12 ? 'PM' : 'AM'
        const startDisplayHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH
        startTimeFormatted = `${startDisplayHour}:${startMinute} ${startPeriod}`
      } else {
        // SLOT-2/3: Use previous slot's time
        const previousSlot = allSlots?.find((s: any) => s.slot_number === slot.slot_number - 1)
        startTime = previousSlot?.slot_time || attendanceWindowStart
        const [startHour, startMinute] = startTime.split(':')
        const startH = parseInt(startHour)
        const startPeriod = startH >= 12 ? 'PM' : 'AM'
        const startDisplayHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH
        startTimeFormatted = `${startDisplayHour}:${startMinute} ${startPeriod}`
      }

      const endTime = slot.slot_time
      
      console.log(`Slot ${slot.slot_number} time range: ${startTime} to ${endTime}`)

      // Get attendance records within time range
      const startDateTime = `${today}T${startTime}`
      const endDateTime = `${today}T${endTime}`
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('user_id, status, check_in_time')
        .eq('date', today)
        .in('status', ['present', 'late'])
        .gte('check_in_time', startDateTime)
        .lt('check_in_time', endDateTime)
        .order('check_in_time', { ascending: true })

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError)
        continue
      }

      const presentCount = attendanceData?.filter((a: any) => a.status === 'present').length || 0
      const lateCount = attendanceData?.filter((a: any) => a.status === 'late').length || 0
      const totalCount = presentCount + lateCount
      const attendanceRate = totalCount > 0 ? 100 : 0

      console.log(`Slot ${slot.slot_number} attendance:`, { presentCount, lateCount, totalCount })

      // Get employee details
      const userIds = attendanceData?.map((a: any) => a.user_id) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || [])

      // Format employee details with check-in times
      const employeeDetails = attendanceData
        ?.map((record: any) => {
          const name = profileMap.get(record.user_id)
          if (!name) return null
          
          const checkInDate = new Date(record.check_in_time)
          const hour = checkInDate.getHours()
          const minute = checkInDate.getMinutes()
          const period = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
          const formattedTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
          
          return {
            name,
            checkInTime: formattedTime,
            status: record.status,
          }
        })
        .filter((detail: any) => detail != null) || []

      console.log(`Found ${employeeDetails.length} employees in time range`)

      // Format slot time for display
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
          slotStartTime: startTimeFormatted,
          slotEndTime: slotTimeFormatted,
          presentCount,
          lateCount,
          totalCount,
          attendanceRate,
          triggeredBy: 'system-cron',
          isManual: false,
          employeeDetails,
        }),
      })

      const result = await response.json()
      results.push({
        slot: slot.slot_number,
        time: `${startTimeFormatted} to ${slotTimeFormatted}`,
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
