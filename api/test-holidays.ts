import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test holidays endpoint - check if holidays exist in database
 * GET /api/test-holidays
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
    console.log('[Test Holidays] Checking holiday tables...');

    // Check recurring holidays
    const { data: recurringHolidays, error: recurringError } = await supabase
      .from('employee_recurring_holidays')
      .select('*')
      .limit(10);

    // Check specific holidays
    const { data: specificHolidays, error: specificError } = await supabase
      .from('employee_specific_holidays')
      .select('*')
      .limit(10);

    // Check profiles for employee names
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role_type')
      .limit(5);

    return res.status(200).json({
      success: true,
      message: 'Holiday tables test complete',
      data: {
        recurring_holidays: {
          count: recurringHolidays?.length || 0,
          error: recurringError?.message || null,
          sample: recurringHolidays?.slice(0, 3) || []
        },
        specific_holidays: {
          count: specificHolidays?.length || 0,
          error: specificError?.message || null,
          sample: specificHolidays?.slice(0, 3) || []
        },
        profiles: {
          count: profiles?.length || 0,
          error: profilesError?.message || null,
          sample: profiles?.slice(0, 3) || []
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Test Holidays] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Test failed',
      stack: error.stack
    });
  }
}