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
    const callId = req.query.callId || 'unknown';
    console.log(`[Holiday API ${callId}] Request received:`, {
      method: req.method,
      url: req.url,
      query: req.query
    });

    if (req.method === 'GET') {
      return await getHolidays(req, res, callId as string);
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
async function getHolidays(req: VercelRequest, res: VercelResponse, callId: string = 'unknown') {
  try {
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

    // Get user profile with minimal fields
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { year, month, start_date, end_date, date, view } = req.query;
    
    // Handle different query parameter formats
    let targetYear: number;
    let targetMonth: number;
    
    if (start_date && end_date) {
      const startDate = new Date(start_date as string);
      targetYear = startDate.getFullYear();
      targetMonth = startDate.getMonth() + 1;
    } else if (date) {
      // Handle single date queries - return employees with holidays on that date
      const queryDate = new Date(date as string);
      targetYear = queryDate.getFullYear();
      targetMonth = queryDate.getMonth() + 1;
      
      // Get employees who have holidays on this specific date (optimized query)
      const { data: specificHolidays, error: specificError } = await supabase
        .from('employee_specific_holidays')
        .select(`
          id,
          employee_id,
          holiday_date,
          reason,
          holiday_type,
          work_applications_allowed,
          profiles!inner(id, full_name, email)
        `)
        .eq('holiday_date', date as string);

      if (specificError) {
        return res.status(500).json({ error: specificError.message });
      }

      const employees = specificHolidays?.map(holiday => ({
        id: holiday.employee_id,
        name: holiday.profiles.full_name,
        email: holiday.profiles.email,
        reason: holiday.reason,
        holiday_type: holiday.holiday_type,
        holiday_id: holiday.id
      })) || [];

      return res.status(200).json({
        employees: employees,
        date: date,
        count: employees.length
      });
    } else {
      targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    }

    // If view=employee, always return employee's own holidays
    if (view === 'employee') {
      console.log(`[Holiday API ${callId}] Employee view requested, calling getEmployeeHolidays`);
      return await getEmployeeHolidays(user, targetYear, targetMonth, start_date as string, end_date as string, res, callId);
    }

    // Admin access detection (optimized)
    const isAdmin = (profile.full_name?.toLowerCase().includes('admin') && !profile.full_name?.toLowerCase().includes('employee')) || 
                   (profile.full_name?.toLowerCase() === 'siddhesh lalit jadhav') ||
                   (profile.email?.toLowerCase().includes('admin') && !profile.email?.toLowerCase().includes('employee'));

    console.log('[Holiday API] Admin check result:', { isAdmin, fullName: profile.full_name, email: profile.email });

    if (isAdmin) {
      console.log('[Holiday API] Admin access granted, fetching all holidays');
      // Admin: Get all holidays with optimized queries
      const startDateStr = (start_date as string) || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
      const endDateStr = (end_date as string) || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`;

      // Parallel queries for better performance
      const [recurringResult, specificResult] = await Promise.all([
        supabase
          .from('employee_recurring_holidays')
          .select(`
            id,
            employee_id,
            day_of_week,
            work_applications_allowed,
            profiles!inner(id, full_name)
          `),
        supabase
          .from('employee_specific_holidays')
          .select(`
            id,
            employee_id,
            holiday_date,
            reason,
            holiday_type,
            work_applications_allowed,
            profiles!inner(id, full_name)
          `)
          .gte('holiday_date', startDateStr)
          .lte('holiday_date', endDateStr)
      ]);

      return res.status(200).json({
        recurring_holidays: recurringResult.data || [],
        specific_holidays: specificResult.data || [],
        year: targetYear,
        month: targetMonth
      });
    } else {
      console.log(`[Holiday API ${callId}] Employee access, calling getEmployeeHolidays`);
      // Employee: Get only their holidays
      return await getEmployeeHolidays(user, targetYear, targetMonth, start_date as string, end_date as string, res, callId);
    }

  } catch (error: any) {
    console.error('[Holiday API] Exception in getHolidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get holidays'
    });
  }
}

/**
 * Get holidays for a specific employee (used when view=employee)
 */
async function getEmployeeHolidays(user: any, targetYear: number, targetMonth: number, start_date: string, end_date: string, res: VercelResponse, callId: string = 'unknown') {
  try {
    const startDateStr = start_date || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDateStr = end_date || `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`;

    console.log(`[Employee Holidays ${callId}] Fetching for user:`, user.id, 'Date range:', startDateStr, 'to', endDateStr);

    // Parallel queries for better performance
    const [recurringResult, specificResult] = await Promise.all([
      supabase
        .from('employee_recurring_holidays')
        .select('*')
        .eq('employee_id', user.id),
      supabase
        .from('employee_specific_holidays')
        .select('*')
        .eq('employee_id', user.id)
        .gte('holiday_date', startDateStr)
        .lte('holiday_date', endDateStr)
    ]);

    console.log(`[Employee Holidays ${callId}] Raw results:`, {
      recurring: recurringResult.data?.length,
      specific: specificResult.data?.length,
      specificSample: specificResult.data?.[0]
    });

    return res.status(200).json({
      recurring_holidays: recurringResult.data || [],
      specific_holidays: specificResult.data || [],
      year: targetYear,
      month: targetMonth
    });

  } catch (error: any) {
    console.error('[Holiday API] Exception in getEmployeeHolidays:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get employee holidays'
    });
  }
}