import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY5MTg1NCwiZXhwIjoyMDg2MjY3ODU0fQ.846KQ7v9nbH5-4COTqEgBGrboFFKrTG7w3AGPP4uIqk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace('/api/holidays', '') || '/';
  
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
      const { start_date, end_date, view } = req.query;
      
      console.log('[Holidays API] GET holidays:', { start_date, end_date, view });

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      if (profile.role === 'admin') {
        // Admin: Get all holidays
        const { data: recurring, error: recurringError } = await supabaseAdmin
          .from('master_recurring_holidays')
          .select('*');

        const { data: specific, error: specificError } = await supabaseAdmin
          .from('master_specific_holidays')
          .select('*');

        if (recurringError || specificError) {
          console.error('[Holidays API] Error fetching holidays:', recurringError || specificError);
          return res.status(500).json({ error: 'Failed to fetch holidays' });
        }

        return res.json({ recurring, specific });
      } else {
        // Employee: Get their holidays
        const { data: recurring, error: recurringError } = await supabaseAdmin
          .from('employee_recurring_holidays')
          .select('*')
          .eq('employee_id', user.id);

        const { data: specific, error: specificError } = await supabaseAdmin
          .from('employee_specific_holidays')
          .select('*')
          .eq('employee_id', user.id);

        if (recurringError || specificError) {
          console.error('[Holidays API] Error fetching holidays:', recurringError || specificError);
          return res.status(500).json({ error: 'Failed to fetch holidays' });
        }

        return res.json({ recurring, specific });
      }
    }

    // POST /api/holidays/specific - Create specific holidays
    if (req.method === 'POST' && path === '/specific') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { employee_id, holiday_date, reason } = req.body;

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { error } = await supabaseAdmin
        .from('employee_specific_holidays')
        .insert([{
          employee_id,
          holiday_date,
          reason,
        }]);

      if (error) {
        console.error('[Holidays API] Error creating holiday:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, message: 'Holiday created' });
    }

    // POST /api/holidays/recurring - Create recurring holidays
    if (req.method === 'POST' && path === '/recurring') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { employee_id, day_of_week, reason } = req.body;

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { error } = await supabaseAdmin
        .from('employee_recurring_holidays')
        .insert([{
          employee_id,
          day_of_week,
          reason,
        }]);

      if (error) {
        console.error('[Holidays API] Error creating recurring holiday:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, message: 'Recurring holiday created' });
    }

    // Default: Not found
    console.log('[Holidays API] Route not found:', req.method, path);
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('[Holidays API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
