import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../server/supabase/client';

/**
 * Test database connection endpoint
 * GET /api/test-db - Test if database connection is working
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Test DB API] Testing database connection...');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1);

    if (testError) {
      console.error('[Test DB API] Database error:', testError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      });
    }

    // Test holiday tables
    const { data: holidayTest, error: holidayError } = await supabase
      .from('employee_recurring_holidays')
      .select('id')
      .limit(1);

    const { data: specificTest, error: specificError } = await supabase
      .from('employee_specific_holidays')
      .select('id')
      .limit(1);

    console.log('[Test DB API] Database connection successful');
    return res.status(200).json({
      success: true,
      message: 'Database connection working',
      tests: {
        profiles: testData?.length || 0,
        recurring_holidays_table: holidayError ? 'ERROR: ' + holidayError.message : 'OK',
        specific_holidays_table: specificError ? 'ERROR: ' + specificError.message : 'OK'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Test DB API] Exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Test failed',
      stack: error.stack
    });
  }
}