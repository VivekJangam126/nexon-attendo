import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Admin access is determined by name, not role_type
    const isAdmin = profile.full_name?.toLowerCase().includes('admin') || 
                   profile.full_name?.toLowerCase().includes('siddhesh') ||
                   profile.email?.toLowerCase().includes('admin') ||
                   profile.email?.toLowerCase().includes('siddhesh');

    console.log('[Specific Holiday API] User details:', {
      id: profile.id,
      name: profile.full_name,
      role: profile.role_type,
      isAdmin: isAdmin,
      status: profile.status
    });

    if (req.method === 'POST') {
      // Allow admin users to create holidays
      if (isAdmin) {
        console.log('[Specific Holiday API] Admin access granted for holiday creation');
        return await createSpecificHolidays(req, res);
      } else {
        return res.status(403).json({ error: 'Admin access required' });
      }
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

    // Create records for each employee
    const records = employee_ids.map(employee_id => ({
      employee_id,
      holiday_date,
      reason,
      holiday_type: holiday_type || 'company_event'
    }));

    const { data, error } = await supabase
      .from('employee_specific_holidays')
      .upsert(records, { onConflict: 'employee_id,holiday_date' })
      .select();

    if (error) {
      console.error('[Specific Holiday API] Database error:', error);
      console.error('[Specific Holiday API] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check if it's an RLS policy error
      if (error.message.includes('row-level security policy') || error.message.includes('RLS')) {
        return res.status(500).json({ 
          error: 'Database security policy error. Please check RLS policies for employee_specific_holidays table.',
          details: error.message
        });
      }
      
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Created specific holidays for ${data?.length || 0} employees`,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('[Specific Holiday API] Error creating specific holidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create specific holidays',
      stack: error.stack
    });
  }
}