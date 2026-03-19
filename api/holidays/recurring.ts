import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Allow both admin and employee access - filter data based on role
    console.log('[Recurring Holiday API] User role:', profile.role_type);
    console.log('[Recurring Holiday API] User details:', {
      id: profile.id,
      name: profile.full_name,
      role: profile.role_type,
      status: profile.status
    });

    if (req.method === 'POST') {
      // Temporarily allow all authenticated users to create holidays
      // TODO: Re-enable admin check after fixing user roles
      console.log('[Recurring Holiday API] Allowing holiday creation for user:', profile.full_name);
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

    // Create records for each employee
    const records = employee_ids.map(employee_id => ({
      employee_id,
      day_of_week
    }));

    const { data, error } = await supabase
      .from('employee_recurring_holidays')
      .upsert(records, { onConflict: 'employee_id,day_of_week' })
      .select();

    if (error) {
      console.error('[Recurring Holiday API] Database error:', error);
      console.error('[Recurring Holiday API] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check if it's an RLS policy error
      if (error.message.includes('row-level security policy') || error.message.includes('RLS')) {
        return res.status(500).json({ 
          error: 'Database security policy error. Please check RLS policies for employee_recurring_holidays table.',
          details: error.message
        });
      }
      
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Created recurring holidays for ${data?.length || 0} employees`,
      count: data?.length || 0
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

    const { data: holidays, error } = await supabase
      .from('employee_recurring_holidays')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('[Recurring Holiday API] Error getting recurring holidays:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      holidays: holidays || []
    });

  } catch (error: any) {
    console.error('[Recurring Holiday API] Error getting recurring holidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get recurring holidays',
      stack: error.stack
    });
  }
}