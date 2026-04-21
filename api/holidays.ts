import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Load from environment variables - try both VITE prefixed and non-prefixed
// This handles both development (Vite with VITE_ prefix) and production (without prefix)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strip query parameters from URL before path matching
  let path = '';
  if (req.url) {
    const url = req.url.split('?')[0];
    path = url.replace('/api/holidays', '') || '/';
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-role');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('[Holidays API] Request:', req.method, path);

  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!authToken) {
      console.log('[Holidays API] No auth token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create authenticated client
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      console.log('[Holidays API] Invalid token:', authError?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // GET /api/holidays - Get holidays for date range
    if (req.method === 'GET' && (path === '/' || path === '')) {
      const { start_date, end_date, date } = req.query;
      
      console.log('[Holidays API] GET holidays:', { start_date, end_date, date });

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // If specific date requested, get holidays for that date (admin only)
      if (date && typeof date === 'string') {
        if (profile.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const dayOfWeek = new Date(date).getDay();
        const employees: Array<{ id: string; name: string; reason: string }> = [];

        // Get employees with recurring holiday on this day
        const { data: recurringData } = await supabase
          .from('employee_recurring_holidays')
          .select('employee_id, profiles!inner(id, full_name)')
          .eq('day_of_week', dayOfWeek);

        if (recurringData) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          recurringData.forEach((item: any) => {
            employees.push({
              id: item.employee_id,
              name: item.profiles.full_name,
              reason: `Weekly holiday (${dayNames[dayOfWeek]})`,
            });
          });
        }

        // Get employees with specific holiday on this date
        const { data: specificData } = await supabase
          .from('employee_specific_holidays')
          .select('employee_id, reason, profiles!inner(id, full_name)')
          .eq('holiday_date', date);

        if (specificData) {
          specificData.forEach((item: any) => {
            if (!employees.find(e => e.id === item.employee_id)) {
              employees.push({
                id: item.employee_id,
                name: item.profiles.full_name,
                reason: item.reason,
              });
            }
          });
        }

        return res.json({ employees });
      }

      // Admin: Get all holidays
      if (profile.role === 'admin') {
        console.log('[Holidays API] Fetching all holidays for admin');

        const { data: recurringHolidays, error: recurringError } = await supabase
          .from('employee_recurring_holidays')
          .select('*')
          .order('day_of_week', { ascending: true });

        let specificQuery = supabase
          .from('employee_specific_holidays')
          .select('*')
          .order('holiday_date', { ascending: true });

        if (start_date && typeof start_date === 'string') {
          specificQuery = specificQuery.gte('holiday_date', start_date);
        }

        if (end_date && typeof end_date === 'string') {
          specificQuery = specificQuery.lte('holiday_date', end_date);
        }

        const { data: specificHolidays, error: specificError } = await specificQuery;

        if (recurringError || specificError) {
          console.error('[Holidays API] Error fetching holidays:', recurringError || specificError);
          return res.status(500).json({
            error: recurringError?.message || specificError?.message,
          });
        }

        console.log('[Holidays API] Found recurring:', recurringHolidays?.length, 'specific:', specificHolidays?.length);

        return res.json({
          recurring_holidays: recurringHolidays || [],
          specific_holidays: specificHolidays || [],
        });
      }

      // Employee: Get own holidays
      console.log('[Holidays API] Fetching holidays for employee:', user.id);

      const { data: recurringHolidays, error: recurringError } = await supabase
        .from('employee_recurring_holidays')
        .select('*')
        .eq('employee_id', user.id)
        .order('day_of_week', { ascending: true });

      let specificQuery = supabase
        .from('employee_specific_holidays')
        .select('*')
        .eq('employee_id', user.id)
        .order('holiday_date', { ascending: true });

      if (start_date && typeof start_date === 'string') {
        specificQuery = specificQuery.gte('holiday_date', start_date);
      }

      if (end_date && typeof end_date === 'string') {
        specificQuery = specificQuery.lte('holiday_date', end_date);
      }

      const { data: specificHolidays, error: specificError } = await specificQuery;

      if (recurringError || specificError) {
        console.error('[Holidays API] Error fetching holidays:', recurringError || specificError);
        return res.status(500).json({
          error: recurringError?.message || specificError?.message,
        });
      }

      return res.json({
        recurring_holidays: recurringHolidays || [],
        specific_holidays: specificHolidays || [],
      });
    }

    // POST /api/holidays/specific - Create specific holidays (admin only)
    if (req.method === 'POST' && path === '/specific') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { employee_ids, holiday_date, holiday_type, reason } = req.body;

      if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(400).json({ error: 'employee_ids must be a non-empty array' });
      }

      if (!holiday_date || !reason) {
        return res.status(400).json({ error: 'Missing required fields: holiday_date, reason' });
      }

      // Create holiday records
      const records = employee_ids.map(employee_id => ({
        employee_id,
        holiday_date,
        holiday_type,
        reason,
      }));

      const { data, error } = await supabase
        .from('employee_specific_holidays')
        .upsert(records, { onConflict: 'employee_id,holiday_date' })
        .select();

      if (error) {
        console.error('[Holidays API] Database error creating specific holidays:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, count: data?.length || 0, message: 'Holidays created' });
    }

    // POST /api/holidays/recurring - Create recurring holidays (admin only)
    if (req.method === 'POST' && path === '/recurring') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { employee_ids, day_of_week } = req.body;

      if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(400).json({ error: 'employee_ids must be a non-empty array' });
      }

      if (day_of_week === undefined || typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
        return res.status(400).json({ error: 'day_of_week must be a number between 0 and 6' });
      }

      // Create holiday records
      const records = employee_ids.map(employee_id => ({
        employee_id,
        day_of_week,
      }));

      const { data, error } = await supabase
        .from('employee_recurring_holidays')
        .upsert(records, { onConflict: 'employee_id,day_of_week' })
        .select();

      if (error) {
        console.error('[Holidays API] Database error creating recurring holidays:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, count: data?.length || 0, message: 'Recurring holidays created' });
    }

    // Default: Not found
    console.log('[Holidays API] Route not found:', req.method, path);
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('[Holidays API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
