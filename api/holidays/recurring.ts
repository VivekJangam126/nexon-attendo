import type { VercelRequest, VercelResponse } from '@vercel/node';
import { holidayService } from '../../server/services/holiday.service';
import { supabase } from '../../server/supabase/client';

/**
 * Recurring holidays API endpoint
 * POST /api/holidays/recurring - Create recurring holidays
 * GET /api/holidays/recurring - Get all recurring holidays (admin only)
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
    console.log('[Recurring Holiday API] Request received:', {
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
      return await createRecurringHolidays(req, res);
    }

    if (req.method === 'GET') {
      return await getAllRecurringHolidays(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Recurring Holiday API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: error.stack
    });
  }
}

/**
 * POST /api/holidays/recurring
 * Create recurring holidays for multiple employees
 */
async function createRecurringHolidays(req: VercelRequest, res: VercelResponse) {
  try {
    const { employee_ids, day_of_week } = req.body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ error: 'employee_ids array is required' });
    }

    if (typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ error: 'day_of_week must be a number between 0-6' });
    }

    console.log('[Recurring Holiday API] Creating recurring holidays:', {
      employee_ids: employee_ids.length,
      day_of_week
    });

    const result = await holidayService.createRecurringHolidays({
      employee_ids,
      day_of_week
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: `Created recurring holidays for ${result.count} employees`,
      count: result.count
    });

  } catch (error: any) {
    console.error('[Recurring Holiday API] Error creating recurring holidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create recurring holidays',
      stack: error.stack
    });
  }
}

/**
 * GET /api/holidays/recurring
 * Get all recurring holidays (admin only)
 */
async function getAllRecurringHolidays(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[Recurring Holiday API] Getting all recurring holidays');

    const result = await holidayService.getAllRecurringHolidays();

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      holidays: result.holidays || []
    });

  } catch (error: any) {
    console.error('[Recurring Holiday API] Error getting recurring holidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get recurring holidays',
      stack: error.stack
    });
  }
}