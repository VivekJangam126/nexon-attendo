import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Siddhesh's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', 'Siddhesh Lalit Jadhav')
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Create work applications for March 2026
    const applications = [
      {
        employee_id: profile.id,
        holiday_date: '2026-03-23',
        reason: 'Need to attend important client meeting',
        status: 'pending'
      },
      {
        employee_id: profile.id,
        holiday_date: '2026-03-14',
        reason: 'Project deadline requires my presence',
        status: 'approved'
      }
    ];

    const { data, error } = await supabase
      .from('employee_work_applications')
      .upsert(applications, {
        onConflict: 'employee_id,holiday_date'
      })
      .select();

    if (error) {
      console.error('Error creating work applications:', error);
      return res.status(400).json({ error: error.message });
    }

    // Fetch all March applications to return
    const { data: marchApps } = await supabase
      .from('employee_work_applications')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .gte('holiday_date', '2026-03-01')
      .lte('holiday_date', '2026-03-31');

    res.json({ 
      success: true, 
      created: data,
      marchApplications: marchApps || [],
      profile: profile.full_name
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}