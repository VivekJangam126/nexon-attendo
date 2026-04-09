import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Load from environment variables - try both process.env and import.meta.env
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || (import.meta as any).env?.SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || (import.meta as any).env?.SUPABASE_SERVICE_ROLE_KEY?.trim();

  console.log('[Leave API] Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    keyLength: supabaseServiceKey?.length || 0,
    keyStart: supabaseServiceKey?.substring(0, 20) || 'undefined',
    keyEnd: supabaseServiceKey?.substring(supabaseServiceKey.length - 20) || 'undefined',
    processEnvWorks: !!process.env.SUPABASE_URL,
    importMetaEnvWorks: !!(import.meta as any).env?.SUPABASE_URL
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Leave API] Missing environment variables!');
    return res.status(500).json({ 
      error: 'Invalid API key',
      details: 'Server configuration error - missing Supabase credentials'
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Test the connection
  try {
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('[Leave API] Supabase connection test failed:', testError);
    } else {
      console.log('[Leave API] Supabase connection test successful');
    }
  } catch (testErr) {
    console.error('[Leave API] Supabase connection test exception:', testErr);
  }

  const path = req.url?.replace('/api/leave', '') || '/';
  
  console.log('[Leave API] Request:', req.method, path);

  try {
    // /api/leave/my-requests
    if (path === '/my-requests' || path.startsWith('/my-requests?')) {
      if (req.method === 'GET') {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
          console.error('[Leave API] No user ID in headers');
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log('[Leave API] Fetching leave requests for user:', userId);
        
        const { data, error } = await supabaseAdmin
          .from('leave_requests')
          .select('*')
          .eq('employee_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Leave API] Query error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('[Leave API] Successfully fetched', data?.length || 0, 'requests');
        return res.status(200).json(data || []);
      }
    }

    // /api/leave/balance
    if (path === '/balance' || path.startsWith('/balance?')) {
      if (req.method === 'GET') {
        const userId = req.headers['x-user-id'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const employeeId = req.query.employeeId as string;
        
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const targetUserId = (employeeId && userRole === 'admin') ? employeeId : userId;
        const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
        
        const { data: balanceWithTypes, error } = await supabaseAdmin
          .from('employee_leave_balance')
          .select(`
            id,
            employee_id,
            leave_type_id,
            total_leaves,
            used_leaves,
            remaining_leaves,
            year,
            leave_type:leave_types(id, name, max_per_year)
          `)
          .eq('employee_id', targetUserId)
          .eq('year', year)
          .order('leave_type_id');

        if (error) {
          console.error('[Balance API] Error:', error);
          return res.status(500).json({ error: 'Failed to fetch balance' });
        }

        return res.status(200).json(balanceWithTypes || []);
      }
    }

    // /api/leave/policies
    if (path === '/policies' || path.startsWith('/policies?')) {
      if (req.method === 'GET') {
        const { data: types } = await supabaseAdmin
          .from('leave_types')
          .select('*')
          .order('name');

        return res.status(200).json({ policies: [], types: types || [] });
      }
    }

    // /api/leave/apply
    if (path === '/apply' || path.startsWith('/apply?')) {
      if (req.method === 'POST') {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { leaveTypeId, startDate, endDate, reason, attachmentUrl, attachmentType } = req.body;
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate days excluding holidays
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        console.log('[Apply] Calculating days for:', { startDate, endDate, userId });
        
        // Fetch employee's holidays
        const { data: recurringHolidays, error: recurringError } = await supabaseAdmin
          .from('employee_recurring_holidays')
          .select('day_of_week')
          .eq('employee_id', userId);

        const { data: specificHolidays, error: specificError } = await supabaseAdmin
          .from('employee_specific_holidays')
          .select('holiday_date')
          .eq('employee_id', userId);

        console.log('[Apply] Holidays fetched:', {
          recurringCount: recurringHolidays?.length || 0,
          specificCount: specificHolidays?.length || 0,
          recurringError: recurringError?.message,
          specificError: specificError?.message
        });

        const recurringDays = recurringHolidays?.map(h => h.day_of_week) || [];
        const specificDates = specificHolidays?.map(h => h.holiday_date) || [];
        
        console.log('[Apply] Holiday data:', {
          recurringDays,
          specificDates
        });
        
        let workingDays = 0;
        const currentDate = new Date(start);
        
        // Iterate through each day and count only working days
        while (currentDate <= end) {
          const dayOfWeek = currentDate.getDay();
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Skip if it's a recurring holiday or specific holiday
          const isRecurringHoliday = recurringDays.includes(dayOfWeek);
          const isSpecificHoliday = specificDates.includes(dateStr);
          
          if (!isRecurringHoliday && !isSpecificHoliday) {
            workingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log('[Apply] Calculated working days:', workingDays);

        const { data, error } = await supabaseAdmin
          .from('leave_requests')
          .insert({
            employee_id: userId,
            leave_type_id: leaveTypeId,
            start_date: startDate,
            end_date: endDate,
            days: workingDays,
            reason: reason || '',
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('[Apply] Error:', error);
          throw error;
        }

        return res.status(201).json(data);
      }
    }

    return res.status(404).json({ error: 'Route not found', path });
  } catch (error: any) {
    console.error('[Leave API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
