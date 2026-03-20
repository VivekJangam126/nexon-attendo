import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Main holidays API endpoint
 * GET /api/holidays - Get holidays for current user
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
    console.log('[Holiday API] Request received:', {
      method: req.method,
      url: req.url,
      query: req.query
    });

    if (req.method === 'GET') {
      return await getHolidays(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Holiday API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: error.stack
    });
  }
}

/**
 * GET /api/holidays
 * Get all holidays (admin) or employee's holidays (employee)
 */
async function getHolidays(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[Holiday API] getHolidays called');
    console.log('[Holiday API] Query params:', req.query);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[Holiday API] No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('[Holiday API] No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[Holiday API] Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[Holiday API] User authenticated:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('[Holiday API] Profile not found');
      return res.status(404).json({ error: 'Profile not found' });
    }

    console.log('[Holiday API] User profile:', profile.role_type);

    const { year, month, start_date, end_date, date } = req.query;
    
    // Handle different query parameter formats
    let targetYear: number;
    let targetMonth: number;
    
    if (start_date && end_date) {
      // Handle date range queries (start_date=2024-01-01&end_date=2024-01-31)
      const startDate = new Date(start_date as string);
      targetYear = startDate.getFullYear();
      targetMonth = startDate.getMonth() + 1;
    } else if (date) {
      // Handle single date queries (date=2024-01-15)
      const queryDate = new Date(date as string);
      targetYear = queryDate.getFullYear();
      targetMonth = queryDate.getMonth() + 1;
    } else {
      // Handle year/month queries or default to current
      targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    }

    console.log('[Holiday API] Target year/month:', targetYear, targetMonth);
    console.log('[Holiday API] Query params:', { year, month, start_date, end_date, date });

    if (profile.role_type === 'Admin' || profile.role_type === 'Super Admin') {
      // Admin: Get all holidays
      console.log('[Holiday API] Admin request - getting all holidays');

      // Get recurring holidays for all employees
      const { data: recurringHolidays, error: recurringError } = await supabase
        .from('employee_recurring_holidays')
        .select(`
          id,
          employee_id,
          day_of_week,
          profiles!inner(id, full_name)
        `);

      if (recurringError) {
        console.error('[Holiday API] Error getting recurring holidays:', recurringError);
      }

      // Get specific holidays for the date range
      const { data: specificHolidays, error: specificError } = await supabase
        .from('employee_specific_holidays')
        .select(`
          id,
          employee_id,
          holiday_date,
          reason,
          holiday_type,
          profiles!inner(id, full_name)
        `)
        .gte('holiday_date', (start_date as string) || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`)
        .lte('holiday_date', (end_date as string) || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`);

      if (specificError) {
        console.error('[Holiday API] Error getting specific holidays:', specificError);
      }

      console.log('[Holiday API] Admin holidays result:', {
        recurring: recurringHolidays?.length || 0,
        specific: specificHolidays?.length || 0,
        sample_recurring: recurringHolidays?.slice(0, 2),
        sample_specific: specificHolidays?.slice(0, 2)
      });

      return res.status(200).json({
        recurring_holidays: recurringHolidays || [],
        specific_holidays: specificHolidays || [],
        year: targetYear,
        month: targetMonth,
        debug: {
          query_params: { start_date, end_date, date },
          data_counts: {
            recurring: recurringHolidays?.length || 0,
            specific: specificHolidays?.length || 0
          }
        }
      });
    } else {
      // Employee: Get only their holidays
      console.log('[Holiday API] Employee request - getting employee holidays');
      
      // Get employee's recurring holidays
      const { data: recurringHolidays, error: recurringError } = await supabase
        .from('employee_recurring_holidays')
        .select('*')
        .eq('employee_id', user.id);

      if (recurringError) {
        console.error('[Holiday API] Error getting employee recurring holidays:', recurringError);
      }

      // Get employee's specific holidays for the date range
      const { data: specificHolidays, error: specificError } = await supabase
        .from('employee_specific_holidays')
        .select('*')
        .eq('employee_id', user.id)
        .gte('holiday_date', (start_date as string) || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`)
        .lte('holiday_date', (end_date as string) || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`);

      if (specificError) {
        console.error('[Holiday API] Error getting employee specific holidays:', specificError);
      }

      console.log('[Holiday API] Employee holidays result:', {
        user_id: user.id,
        recurring: recurringHolidays?.length || 0,
        specific: specificHolidays?.length || 0,
        recurring_sample: recurringHolidays?.slice(0, 2),
        specific_sample: specificHolidays?.slice(0, 2),
        date_range: { start_date, end_date }
      });

      return res.status(200).json({
        recurring_holidays: recurringHolidays || [],
        specific_holidays: specificHolidays || [],
        year: targetYear,
        month: targetMonth
      });
    }

  } catch (error: any) {
    console.error('[Holiday API] Exception in getHolidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get holidays',
      stack: error.stack
    });
  }
}