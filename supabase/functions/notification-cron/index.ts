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
      console.log(`\n=== Processing Slot ${slot.slot_number} ===`)
      
      // For display purposes: show the slot's specific time window
      let slotStartTime: string
      let slotStartTimeFormatted: string
      
      if (slot.slot_number === 1) {
        // SLOT-1: Use attendance window start
        slotStartTime = attendanceWindowStart
        const [startHour, startMinute] = slotStartTime.split(':')
        const startH = parseInt(startHour)
        const startPeriod = startH >= 12 ? 'PM' : 'AM'
        const startDisplayHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH
        slotStartTimeFormatted = `${startDisplayHour}:${startMinute} ${startPeriod}`
      } else {
        // SLOT-2/3: Use previous slot's time for display
        const previousSlot = allSlots?.find((s: any) => s.slot_number === slot.slot_number - 1)
        slotStartTime = previousSlot?.slot_time || attendanceWindowStart
        const [startHour, startMinute] = slotStartTime.split(':')
        const startH = parseInt(startHour)
        const startPeriod = startH >= 12 ? 'PM' : 'AM'
        const startDisplayHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH
        slotStartTimeFormatted = `${startDisplayHour}:${startMinute} ${startPeriod}`
      }

      const endTime = slot.slot_time
      
      console.log(`Slot ${slot.slot_number} display time range: ${slotStartTime} to ${endTime}`)
      
      // IMPORTANT: Convert IST times to UTC for database query
      // Attendance records are stored in UTC, but slot times are in IST
      // IST is UTC+5:30, so we need to subtract 5 hours 30 minutes
      
      const [startHour, startMin] = attendanceWindowStart.split(':').map(Number)
      const [endHour, endMin] = endTime.split(':').map(Number)
      
      // Convert IST to UTC by subtracting 5:30
      let utcStartHour = startHour - 5
      let utcStartMin = startMin - 30
      if (utcStartMin < 0) {
        utcStartMin += 60
        utcStartHour -= 1
      }
      if (utcStartHour < 0) {
        utcStartHour += 24
      }
      
      let utcEndHour = endHour - 5
      let utcEndMin = endMin - 30
      if (utcEndMin < 0) {
        utcEndMin += 60
        utcEndHour -= 1
      }
      if (utcEndHour < 0) {
        utcEndHour += 24
      }
      
      const utcStartTime = `${utcStartHour.toString().padStart(2, '0')}:${utcStartMin.toString().padStart(2, '0')}:00`
      const utcEndTime = `${utcEndHour.toString().padStart(2, '0')}:${utcEndMin.toString().padStart(2, '0')}:00`
      
      const startDateTime = `${today}T${utcStartTime}`
      const endDateTime = `${today}T${utcEndTime}`
      
      console.log(`IST times: ${attendanceWindowStart} to ${endTime}`)
      console.log(`UTC times: ${utcStartTime} to ${utcEndTime}`)
      console.log(`Fetching attendance from ${startDateTime} to ${endDateTime}`)
      
      // First, let's check if ANY attendance exists for today
      const { data: allTodayAttendance, error: allAttError } = await supabase
        .from('attendance')
        .select('user_id, status, check_in_time, date')
        .eq('date', today)
      
      console.log(`Total attendance records for ${today}: ${allTodayAttendance?.length || 0}`)
      if (allTodayAttendance && allTodayAttendance.length > 0) {
        console.log('Sample records:', JSON.stringify(allTodayAttendance.slice(0, 3), null, 2))
      }
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('user_id, status, check_in_time')
        .eq('date', today)
        .in('status', ['present', 'late'])
        .gte('check_in_time', startDateTime)
        .lte('check_in_time', endDateTime)
        .order('check_in_time', { ascending: true })

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError)
        continue
      }

      console.log(`Found ${attendanceData?.length || 0} attendance records`)

      const presentCount = attendanceData?.filter((a: any) => a.status === 'present').length || 0
      const lateCount = attendanceData?.filter((a: any) => a.status === 'late').length || 0
      const totalCount = presentCount + lateCount
      
      // Get total number of employees to calculate proper percentage
      const { data: allEmployees } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'employee')
      
      const totalEmployees = allEmployees?.length || 1
      const absentCount = totalEmployees - totalCount
      const attendanceRate = totalEmployees > 0 ? Math.round((totalCount / totalEmployees) * 100) : 0

      console.log(`Slot ${slot.slot_number} attendance:`, { 
        presentCount, 
        lateCount, 
        absentCount,
        totalCount, 
        totalEmployees, 
        attendanceRate 
      })

      // Get employee details
      const userIds = attendanceData?.map((a: any) => a.user_id) || []
      
      if (userIds.length === 0) {
        console.log('No user IDs to fetch profiles for')
      }
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      if (profileError) {
        console.error('Error fetching profiles:', profileError)
      }

      console.log(`Fetched ${profiles?.length || 0} profiles`)

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || [])

      // Format employee details with check-in times (convert UTC to IST)
      const employeeDetails = attendanceData
        ?.map((record: any) => {
          const name = profileMap.get(record.user_id)
          if (!name) {
            console.log(`Warning: No profile found for user_id ${record.user_id}`)
            return null
          }
          
          // Convert UTC time to IST (add 5 hours 30 minutes)
          const checkInDate = new Date(record.check_in_time)
          const istDate = new Date(checkInDate.getTime() + (5.5 * 60 * 60 * 1000))
          const hour = istDate.getHours()
          const minute = istDate.getMinutes()
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
      console.log('Employee details:', JSON.stringify(employeeDetails, null, 2))

      // Format slot time for display
      const [hour, minute] = slot.slot_time.split(':')
      const h = parseInt(hour)
      const period = h >= 12 ? 'PM' : 'AM'
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
      const slotTimeFormatted = `${displayHour}:${minute} ${period}`

      // Call send-notification function
      const functionUrl = `${supabaseUrl}/functions/v1/send-notification`
      
      const requestBody = {
        slotNumber: slot.slot_number,
        slotTime: slotTimeFormatted,
        slotStartTime: slotStartTimeFormatted,
        slotEndTime: slotTimeFormatted,
        presentCount,
        lateCount,
        absentCount,
        totalCount,
        totalEmployees,
        attendanceRate,
        triggeredBy: 'system-cron',
        isManual: false,
        employeeDetails,
      }
      
      console.log('Sending notification request:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      results.push({
        slot: slot.slot_number,
        time: `${slotStartTimeFormatted} to ${slotTimeFormatted}`,
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
