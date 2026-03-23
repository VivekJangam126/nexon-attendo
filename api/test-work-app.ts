import { supabase } from '../server/lib/supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a test work application for March 14, 2026
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', 'Siddhesh Lalit Jadhav')
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { data, error } = await supabase
      .from('employee_work_applications')
      .insert({
        employee_id: profile.id,
        holiday_date: '2026-03-14',
        reason: 'Need to complete urgent project work',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work application:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}