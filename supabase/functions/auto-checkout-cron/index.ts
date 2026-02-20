/**
 * Auto Check-Out Cron Job
 * Runs daily to automatically check out all employees
 * who checked in today but haven't checked out yet
 * 
 * Configuration:
 * - Reads default checkout time from attendance_settings table
 * - Respects auto_checkout_enabled flag
 * - Default fallback: 6:30 PM IST if settings not found
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🕐 [AUTO CHECK-OUT CRON] Starting automatic check-out process...');

    // Verify cron secret for security
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized: Invalid cron secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log(`📅 Processing date: ${todayDate} (IST)`);
    console.log(`⏰ Current IST time: ${istTime.toISOString()}`);

    // Fetch checkout settings from database
    console.log('📋 Fetching checkout settings from database...');
    
    // Get default checkout time
    const { data: timeSettings, error: timeError } = await supabase
      .from('attendance_settings')
      .select('setting_value')
      .eq('setting_name', 'default_checkout_time')
      .single();

    // Get auto-checkout enabled flag
    const { data: autoSettings, error: autoError } = await supabase
      .from('attendance_settings')
      .select('setting_value')
      .eq('setting_name', 'auto_checkout_enabled')
      .single();

    if (timeError || !timeSettings) {
      console.error('❌ Error fetching checkout time settings:', timeError);
      // Fallback to default 6:30 PM if settings not found
      console.log('⚠️  Using fallback default: 18:30 (6:30 PM)');
    }

    // Check if auto-checkout is enabled
    const autoCheckoutEnabled = autoSettings?.setting_value === 'true' || autoSettings?.setting_value === true;
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
    const defaultTime = timeSettings?.setting_value || '18:30:00';
    const [hours, minutes] = defaultTime.split(':').map(Number);
    
    console.log(`⚙️  Default checkout time from settings: ${hours}:${minutes.toString().padStart(2, '0')}`);

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
      throw new Error(`Failed to update attendance: ${updateError.message}`);
    }

    const processedCount = updatedRecords?.length || 0;
    console.log(`✅ Successfully checked out ${processedCount} employees`);

    // Log details for each checked-out employee
    if (updatedRecords) {
      updatedRecords.forEach((record: Attendance) => {
        console.log(`  ✓ User ${record.user_id}: ${record.status} → checked out at 6:00 PM`);
      });
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
