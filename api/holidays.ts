import type { VercelRequest, VercelResponse } from '@vercel/node';
import { holidayService } from '../server/services/holiday.service';
import { supabase } from '../server/supabase/client';

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
      // Admin: Get all holidays for the month
      console.log('[Holiday API] Admin request - getting all holidays');
      const result = await holidayService.getMonthHolidays(targetYear, targetMonth);
      
      if (result.error) {
        console.error('[Holiday API] Error getting month holidays:', result.error);
        return res.status(500).json({ error: result.error });
      }

      console.log('[Holiday API] Admin holidays result:', result.holidays?.length || 0, 'days');
      return res.status(200).json({
        holidays: result.holidays || [],
        year: targetYear,
        month: targetMonth
      });
    } else {
      // Employee: Get only their holidays
      console.log('[Holiday API] Employee request - getting employee holidays');
      const result = await holidayService.getEmployeeHolidaysForMonth(user.id, targetYear, targetMonth);
      
      if (result.error) {
        console.error('[Holiday API] Error getting employee holidays:', result.error);
        return res.status(500).json({ error: result.error });
      }

      console.log('[Holiday API] Employee holidays result:', result.holidays?.length || 0, 'days');
      return res.status(200).json({
        holidays: result.holidays || [],
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