/**
 * Holiday API Endpoints
 * Handles holiday management for admin and employee views
 */

import type { Request, Response } from 'express';
import { holidayService } from '../services/holiday.service';
import { supabase } from '../supabase/client';

/**
 * Main router for holiday endpoints
 */
export default async function handler(req: Request, res: Response) {
  const { method, url } = req;
  
  // Extract pathname - handle both full URL and relative path
  let pathname = '';
  if (url) {
    // Remove /api/holidays prefix if present
    const cleanUrl = url.replace('/api/holidays', '');
    
    // Remove query parameters to get clean pathname
    const queryIndex = cleanUrl.indexOf('?');
    if (queryIndex !== -1) {
      pathname = cleanUrl.substring(0, queryIndex);
    } else {
      pathname = cleanUrl;
    }
    
    // If pathname is empty, set to /
    if (!pathname) {
      pathname = '/';
    }
  }

  console.log('[Holiday API] Method:', method, 'Full URL:', url, 'Pathname:', pathname);

  try {
    // GET /api/holidays
    if (method === 'GET' && (pathname === '' || pathname === '/')) {
      console.log('[Holiday API] Routing to getHolidays');
      return await getHolidays(req, res);
    }

    // POST /api/holidays/recurring
    if (method === 'POST' && pathname === '/recurring') {
      console.log('[Holiday API] Routing to createRecurringHolidays');
      return await createRecurringHolidays(req, res);
    }

    // POST /api/holidays/year-reset
    if (method === 'POST' && pathname === '/year-reset') {
      console.log('[Holiday API] Routing to yearReset');
      return await yearReset(req, res);
    }

    // GET/POST /api/holidays/sync
    if ((method === 'GET' || method === 'POST') && pathname === '/sync') {
      console.log('[Holiday API] Routing to sync');
      const syncHandler = await import('./holidays/sync');
      return await syncHandler.default(req, res);
    }

    // POST /api/holidays/specific
    if (method === 'POST' && pathname === '/specific') {
      console.log('[Holiday API] Routing to createSpecificHolidays');
      return await createSpecificHolidays(req, res);
    }

    // DELETE /api/holidays/:id
    if (method === 'DELETE' && pathname.match(/^\/[a-f0-9-]+$/)) {
      console.log('[Holiday API] Routing to deleteHoliday');
      return await deleteHoliday(req, res);
    }

    // DELETE /api/holidays/day/:dayOfWeek
    if (method === 'DELETE' && pathname.match(/^\/day\/\d+$/)) {
      console.log('[Holiday API] Routing to deleteRecurringHolidaysByDay');
      return await deleteRecurringHolidaysByDay(req, res);
    }

    // DELETE /api/holidays/date/:date
    if (method === 'DELETE' && pathname.match(/^\/date\/\d{4}-\d{2}-\d{2}$/)) {
      console.log('[Holiday API] Routing to deleteSpecificHolidaysByDate');
      return await deleteSpecificHolidaysByDate(req, res);
    }

    // Not found
    console.log('[Holiday API] No route matched for:', method, pathname);
    return res.status(404).json({ error: 'Endpoint not found', method, pathname });
  } catch (err) {
    console.error('[Holiday API] Error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

/**
 * GET /api/holidays
 * Get all holidays (admin) or employee's holidays (employee)
 */
export async function getHolidays(req: Request, res: Response) {
  try {
    console.log('[Holiday API] getHolidays called');
    console.log('[Holiday API] Query params:', req.query);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[Holiday API] No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create authenticated Supabase client with user's token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
    
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[Holiday API] Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[Holiday API] User authenticated:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await authenticatedSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('[Holiday API] Profile not found');
      return res.status(404).json({ error: 'Profile not found' });
    }

    console.log('[Holiday API] User role:', profile.role);

    const { start_date, end_date, date } = req.query;

    // If specific date requested, get holidays for that date (admin only)
    if (date && typeof date === 'string') {
      if (profile.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const dayOfWeek = new Date(date).getDay();
      const employees: Array<{ id: string; name: string; reason: string }> = [];

      // Get employees with recurring holiday on this day
      const { data: recurringData } = await authenticatedSupabase
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
      const { data: specificData } = await authenticatedSupabase
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
      console.log('[Holiday API] Fetching all holidays for admin');

      const { data: recurringHolidays, error: recurringError } = await authenticatedSupabase
        .from('employee_recurring_holidays')
        .select('*')
        .order('day_of_week', { ascending: true });

      let specificQuery = authenticatedSupabase
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
        console.error('[Holiday API] Error fetching holidays:', recurringError || specificError);
        return res.status(500).json({
          error: recurringError?.message || specificError?.message,
        });
      }

      console.log('[Holiday API] Found recurring:', recurringHolidays?.length, 'specific:', specificHolidays?.length);

      return res.json({
        recurring_holidays: recurringHolidays || [],
        specific_holidays: specificHolidays || [],
      });
    }

    // Employee: Get own holidays
    console.log('[Holiday API] Fetching holidays for employee:', user.id);

    const { data: recurringHolidays, error: recurringError } = await authenticatedSupabase
      .from('employee_recurring_holidays')
      .select('*')
      .eq('employee_id', user.id)
      .order('day_of_week', { ascending: true });

    let specificQuery = authenticatedSupabase
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
      console.error('[Holiday API] Error fetching holidays:', recurringError || specificError);
      return res.status(500).json({
        error: recurringError?.message || specificError?.message,
      });
    }

    console.log('[Holiday API] Found recurring:', recurringHolidays?.length, 'specific:', specificHolidays?.length);

    return res.json({
      recurring_holidays: recurringHolidays || [],
      specific_holidays: specificHolidays || [],
    });
  } catch (err) {
    console.error('Error in getHolidays:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch holidays',
    });
  }
}

/**
 * POST /api/holidays/recurring
 * Create recurring holidays (admin only)
 */
/**
 * POST /api/holidays/recurring
 * Create recurring holidays (admin only)
 */
export async function createRecurringHolidays(req: Request, res: Response) {
  try {
    console.log('[Holiday API] createRecurringHolidays called');
    console.log('[Holiday API] Request method:', req.method);
    console.log('[Holiday API] Request body:', JSON.stringify(req.body));

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[Holiday API] No authorization header');
      return res.status(401).json({ error: 'Unauthorized - No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Holiday API] Token length:', token.length);
    
    // Create authenticated Supabase client with user's token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
    
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[Holiday API] Invalid token:', authError?.message);
      return res.status(401).json({ error: 'Invalid token', details: authError?.message });
    }

    console.log('[Holiday API] User authenticated:', user.id);

    // Verify admin role
    const { data: profile, error: profileError } = await authenticatedSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('[Holiday API] Profile error:', profileError?.message);
      return res.status(403).json({ error: 'Profile not found', details: profileError?.message });
    }

    if (profile.role !== 'admin') {
      console.log('[Holiday API] Not admin, role is:', profile.role);
      return res.status(403).json({ error: 'Admin access required', role: profile.role });
    }

    console.log('[Holiday API] Admin verified');

    const { employee_ids, day_of_week } = req.body;
    console.log('[Holiday API] Parsed data - employee_ids:', employee_ids, 'day_of_week:', day_of_week);

    if (!employee_ids || !Array.isArray(employee_ids)) {
      console.log('[Holiday API] Invalid employee_ids:', typeof employee_ids, employee_ids);
      return res.status(400).json({ 
        error: 'employee_ids must be an array',
        received: typeof employee_ids,
        value: employee_ids
      });
    }

    if (employee_ids.length === 0) {
      console.log('[Holiday API] Empty employee_ids array');
      return res.status(400).json({ error: 'employee_ids array is empty' });
    }

    if (day_of_week === undefined || day_of_week === null) {
      console.log('[Holiday API] Missing day_of_week');
      return res.status(400).json({ error: 'day_of_week is required' });
    }

    if (typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
      console.log('[Holiday API] Invalid day_of_week:', day_of_week);
      return res.status(400).json({ 
        error: 'day_of_week must be a number between 0 and 6',
        received: day_of_week
      });
    }

    console.log('[Holiday API] Creating holidays directly with authenticated client');

    // Create holiday records directly using authenticated client
    const records = employee_ids.map(employee_id => ({
      employee_id,
      day_of_week,
    }));

    const { data, error } = await authenticatedSupabase
      .from('employee_recurring_holidays')
      .upsert(records, { onConflict: 'employee_id,day_of_week' })
      .select();

    if (error) {
      console.log('[Holiday API] Database error:', error);
      return res.status(400).json({ error: error.message });
    }

    const count = data?.length || 0;
    console.log('[Holiday API] Success, created:', count);
    return res.json({ success: true, count });
  } catch (err) {
    console.error('[Holiday API] Exception in createRecurringHolidays:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to create holidays',
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

/**
 * POST /api/holidays/specific
 * Create specific date holidays (admin only)
 */
export async function createSpecificHolidays(req: Request, res: Response) {
  try {
    console.log('[Holiday API] createSpecificHolidays called');

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create authenticated Supabase client with user's token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
    
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await authenticatedSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { employee_ids, holiday_date, holiday_type, reason } = req.body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ error: 'employee_ids must be a non-empty array' });
    }

    if (!holiday_date || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create holiday records directly using authenticated client
    const records = employee_ids.map(employee_id => ({
      employee_id,
      holiday_date,
      holiday_type,
      reason,
    }));

    const { data, error } = await authenticatedSupabase
      .from('employee_specific_holidays')
      .upsert(records, { onConflict: 'employee_id,holiday_date' })
      .select();

    if (error) {
      console.error('[Holiday API] Database error:', error);
      return res.status(400).json({ error: error.message });
    }

    const count = data?.length || 0;
    return res.json({ success: true, count });
  } catch (err) {
    console.error('Error in createSpecificHolidays:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to create holidays',
    });
  }
}

/**
 * DELETE /api/holidays/:id
 * Delete a holiday (admin only)
 */
export async function deleteHoliday(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
    
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await authenticatedSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Extract ID from pathname
    const id = req.url?.split('/').pop()?.split('?')[0] || '';
    const { category } = req.query; // 'recurring' or 'specific'

    if (category === 'recurring') {
      const { error } = await authenticatedSupabase
        .from('employee_recurring_holidays')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }
    } else if (category === 'specific') {
      const { error } = await authenticatedSupabase
        .from('employee_specific_holidays')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }
    } else {
      return res.status(400).json({ error: 'Invalid category' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in deleteHoliday:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to delete holiday',
    });
  }
}

/**
 * DELETE /api/holidays/day/:dayOfWeek
 * Delete all recurring holidays for a specific day (admin only)
 */
export async function deleteRecurringHolidaysByDay(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Extract day from pathname
    const dayOfWeek = req.url?.split('/').pop() || '';
    const day = parseInt(dayOfWeek, 10);

    if (isNaN(day) || day < 0 || day > 6) {
      return res.status(400).json({ error: 'Invalid day of week' });
    }

    const { success, error, count } = await holidayService.deleteRecurringHolidaysByDay(day);

    if (!success) {
      return res.status(400).json({ error });
    }

    return res.json({ success: true, count });
  } catch (err) {
    console.error('Error in deleteRecurringHolidaysByDay:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to delete holidays',
    });
  }
}

/**
 * DELETE /api/holidays/date/:date
 * Delete all specific holidays for a specific date (admin only)
 */
export async function deleteSpecificHolidaysByDate(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Extract date from pathname
    const date = req.url?.split('/').pop() || '';

    const { success, error, count } = await holidayService.deleteSpecificHolidaysByDate(date);

    if (!success) {
      return res.status(400).json({ error });
    }

    return res.json({ success: true, count });
  } catch (err) {
    console.error('Error in deleteSpecificHolidaysByDate:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to delete holidays',
    });
  }
}


/**
 * POST /api/holidays/year-reset
 * Manually trigger year-end holiday reset (admin only)
 */
async function yearReset(req: Request, res: Response) {
  try {
    // Verify user is authenticated and is admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Call the year reset function
    const { error: resetError } = await supabase.rpc('manual_year_reset');

    if (resetError) {
      console.error('[Year Reset] Error:', resetError);
      return res.status(500).json({ error: 'Failed to reset holidays' });
    }

    // Get count of remaining holidays
    const { count: specificCount } = await supabase
      .from('employee_specific_holidays')
      .select('*', { count: 'exact', head: true });

    const { count: recurringCount } = await supabase
      .from('employee_recurring_holidays')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      message: 'Holiday year reset completed successfully',
      remaining_holidays: {
        specific: specificCount || 0,
        recurring: recurringCount || 0
      }
    });
  } catch (error) {
    console.error('[Year Reset] Exception:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
