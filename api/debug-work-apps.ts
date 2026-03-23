import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  try {
    // Check all work applications
    const { data: allApps, error: allError } = await supabase
      .from('employee_work_applications')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .order('holiday_date');

    if (allError) {
      console.error('Error fetching all work applications:', allError);
      return res.status(400).json({ error: allError.message });
    }

    // Check work applications for April 2026
    const { data: aprilApps, error: aprilError } = await supabase
      .from('employee_work_applications')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .gte('holiday_date', '2026-04-01')
      .lte('holiday_date', '2026-04-30')
      .order('holiday_date');

    if (aprilError) {
      console.error('Error fetching April work applications:', aprilError);
      return res.status(400).json({ error: aprilError.message });
    }

    // Create a test work application for April 14, 2026
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', 'Siddhesh Lalit Jadhav')
      .single();

    let created = null;
    if (profile) {
      const { data: newApp, error: createError } = await supabase
        .from('employee_work_applications')
        .upsert({
          employee_id: profile.id,
          holiday_date: '2026-04-14',
          reason: 'Debug test - want to work on April 14th',
          status: 'pending'
        }, {
          onConflict: 'employee_id,holiday_date'
        })
        .select()
        .single();

      if (!createError) {
        created = newApp;
      }
    }

    res.json({
      success: true,
      allApplications: allApps || [],
      aprilApplications: aprilApps || [],
      createdTest: created,
      profile: profile?.full_name || 'Not found'
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}