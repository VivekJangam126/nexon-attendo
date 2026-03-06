/**
 * Auto Check-Out Cron Job
 * Runs daily at 8:00 PM IST to automatically check out all employees
 * who checked in today but haven't checked out yet
 * 
 * Configuration:
 * - Reads default checkout time from attendance_settings table
 * - Respects auto_checkout_enabled flag
 * - Sets checkout time to admin-configured time (not 8 PM)
 * - Runs at 8 PM but sets checkout to configured time (e.g., 6:30 PM)
 * 
 * Schedule: Daily at 8:00 PM IST (14:30 UTC)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Attendance {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
}

Deno.serve(async (req: { method: string; headers: { get: (arg0: string) => any; }; }) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = new Date();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 [AUTO CHECK-OUT CRON] Function invoked at:', startTime.toISOString());
  console.log('═══════════════════════════════════════════════════════════');

  try {
    console.log('🕐 Starting automatic check-out process...');
    console.log('✅ Request authenticated via Supabase JWT');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current IST time
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    // Get today's date in YYYY-MM-DD format (IST)
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    
    // Get current time
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentSecond = istTime.getSeconds();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:${String(currentSecond).padStart(2, '0')}`;

    console.log(`📅 Processing date: ${todayDate} (IST)`);
    console.log(`⏰ Current IST time: ${currentTimeStr}`);

    // Fetch checkout settings from database
    console.log('📋 Fetching checkout settings from database...');
    
    // Get settings from the attendance_settings table (stored as columns)
    const { data: settings, error: settingsError } = await supabase
      .from('attendance_settings')
      .select('default_checkout_time, auto_checkout_enabled')
      .eq('setting_name', 'default_attendance_window')
      .single();

    if (settingsError || !settings) {
      console.error('❌ Error fetching checkout settings:', settingsError);
      console.log('⚠️  Using fallback default: 18:30 (6:30 PM)');
    }

    console.log('📋 Settings fetched:', JSON.stringify(settings));

    // Check if auto-checkout is enabled
    const autoCheckoutEnabled = settings?.auto_checkout_enabled ?? true;
    console.log(`⚙️  Auto-checkout enabled: ${autoCheckoutEnabled}`);

    if (!autoCheckoutEnabled) {
      console.log('⏸️  Auto-checkout is disabled. Skipping checkout process.');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Auto-checkout is disabled',
          date: todayDate,
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the default checkout time from settings (format: HH:MM:SS)
    const defaultTime = settings?.default_checkout_time || '18:30:00';
    const [hours, minutes] = defaultTime.split(':').map(Number);
    const configuredTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    console.log(`⚙️  Configured checkout time: ${configuredTimeStr}`);
    console.log(`⏰  Current time (HH:MM): ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
    console.log(`✅ Running daily auto-checkout at 8 PM IST`);
    console.log(`📝 Will set checkout time to configured time: ${configuredTimeStr}`);

    // Set check-out time to configured time IST today
    const checkOutTime = new Date(istTime);
    checkOutTime.setHours(hours, minutes, 0, 0);
    
    // Convert IST to UTC by subtracting 5 hours 30 minutes
    const checkOutTimeUTC = new Date(checkOutTime.getTime() - (5.5 * 60 * 60 * 1000));
    const checkOutTimeISO = checkOutTimeUTC.toISOString();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    console.log(`🕕 Check-out time (IST): ${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`);
    console.log(`🕕 Check-out time (UTC): ${checkOutTimeISO}`);

    // Find all attendance records for today without check-out time
    const { data: attendanceRecords, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', todayDate)
      .is('check_out_time', null);

    if (fetchError) {
      console.error('❌ Error fetching attendance records:', fetchError);
      throw new Error(`Failed to fetch attendance: ${fetchError.message}`);
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log('✅ No pending check-outs found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending check-outs',
          date: todayDate,
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${attendanceRecords.length} attendance records to check out`);
    console.log(`🕕 Setting checkout time to: ${checkOutTimeISO} (UTC) = ${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm} (IST)`);

    // Update all records with check-out time
    const { data: updatedRecords, error: updateError } = await supabase
      .from('attendance')
      .update({
        check_out_time: checkOutTimeISO,
        updated_at: new Date().toISOString(),
      })
      .eq('date', todayDate)
      .is('check_out_time', null)
      .select();

    if (updateError) {
      console.error('❌ Error updating attendance records:', updateError);
      console.error('Update error details:', JSON.stringify(updateError));
      throw new Error(`Failed to update attendance: ${updateError.message}`);
    }

    const processedCount = updatedRecords?.length || 0;
    console.log(`✅ Successfully checked out ${processedCount} employees`);

    // Log details for each checked-out employee
    if (updatedRecords && updatedRecords.length > 0) {
      console.log('📝 Checkout details:');
      updatedRecords.forEach((record: Attendance, index: number) => {
        console.log(`  ${index + 1}. User ${record.user_id}: ${record.status} → checked out`);
      });
    } else {
      console.log('⚠️  No records were updated (this might indicate a timing issue)');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully checked out ${processedCount} employees`,
        date: todayDate,
        processed: processedCount,
        checkOutTime: checkOutTimeISO,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Auto check-out cron error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
