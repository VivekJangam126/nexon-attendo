import type { VercelRequest, VercelResponse } from '@vercel/node';
import { holidayService } from '../../server/services/holiday.service';
import { supabase } from '../../server/supabase/client';

/**
 * Specific holidays API endpoint
 * POST /api/holidays/specific - Create specific holidays
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Specific Holiday API] Request received:', {
      method: req.method,
      url: req.url,
      body: req.body
    });

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if user is admin
    if (profile.role_type !== 'Admin' && profile.role_type !== 'Super Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'POST') {
      return await createSpecificHolidays(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Specific Holiday API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: error.stack
    });
  }
}

/**
 * POST /api/holidays/specific
 * Create specific holidays for multiple employees on a specific date
 */
async function createSpecificHolidays(req: VercelRequest, res: VercelResponse) {
  try {
    const { employee_ids, holiday_date, reason, holiday_type } = req.body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ error: 'employee_ids array is required' });
    }

    if (!holiday_date) {
      return res.status(400).json({ error: 'holiday_date is required (YYYY-MM-DD format)' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    console.log('[Specific Holiday API] Creating specific holidays:', {
      employee_ids: employee_ids.length,
      holiday_date,
      reason,
      holiday_type
    });

    const result = await holidayService.createSpecificHolidays({
      employee_ids,
      holiday_date,
      reason,
      holiday_type: holiday_type || 'company_event'
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: `Created specific holidays for ${result.count} employees`,
      count: result.count
    });

  } catch (error: any) {
    console.error('[Specific Holiday API] Error creating specific holidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create specific holidays',
      stack: error.stack
    });
  }
}