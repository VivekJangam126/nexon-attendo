import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Debug user holidays endpoint
 * GET /api/debug-user-holidays?user_id=xxx
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id parameter required' });
    }

    console.log('[Debug User Holidays] Checking holidays for user:', user_id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    // Get user's recurring holidays
    const { data: recurringHolidays, error: recurringError } = await supabase
      .from('employee_recurring_holidays')
      .select('*')
      .eq('employee_id', user_id);

    // Get user's specific holidays
    const { data: specificHolidays, error: specificError } = await supabase
      .from('employee_specific_holidays')
      .select('*')
      .eq('employee_id', user_id);

    // Get all specific holidays for March 2026 to see if user should have any
    const { data: allMarchHolidays, error: marchError } = await supabase
      .from('employee_specific_holidays')
      .select('*')
      .gte('holiday_date', '2026-03-01')
      .lte('holiday_date', '2026-03-31');

    return res.status(200).json({
      success: true,
      user_id,
      profile: {
        data: profile,
        error: profileError?.message || null
      },
      recurring_holidays: {
        count: recurringHolidays?.length || 0,
        data: recurringHolidays || [],
        error: recurringError?.message || null
      },
      specific_holidays: {
        count: specificHolidays?.length || 0,
        data: specificHolidays || [],
        error: specificError?.message || null
      },
      all_march_holidays: {
        count: allMarchHolidays?.length || 0,
        sample: allMarchHolidays?.slice(0, 5) || [],
        error: marchError?.message || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Debug User Holidays] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Debug failed',
      stack: error.stack
    });
  }
}