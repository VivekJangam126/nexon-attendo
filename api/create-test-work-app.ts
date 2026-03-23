import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get any profile to create a test application
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ error: 'No profiles found' });
    }

    const profile = profiles[0];

    // Create a test work application for March 14, 2026
    const { data, error } = await supabase
      .from('employee_work_applications')
      .upsert({
        employee_id: profile.id,
        holiday_date: '2026-03-14',
        reason: 'Test work application for debugging',
        status: 'pending'
      }, {
        onConflict: 'employee_id,holiday_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work application:', error);
      return res.status(400).json({ error: error.message });
    }

    // Also check existing work applications
    const { data: existing } = await supabase
      .from('employee_work_applications')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .eq('holiday_date', '2026-03-14');

    res.json({ 
      success: true, 
      created: data,
      existing: existing || [],
      profile: profile.full_name
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}