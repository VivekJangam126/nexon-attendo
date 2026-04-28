import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Load from environment variables inside handler
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Admin API] Missing Supabase credentials');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'Missing Supabase credentials'
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const path = req.url?.replace('/api/admin', '') || '/';
  
  console.log('[Admin API] Request:', req.method, path);

  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // /api/admin/leave/requests
    if (path === '/leave/requests' || path.startsWith('/leave/requests?')) {
      if (req.method === 'GET') {
        const { status, employeeId } = req.query;
        
        let query = supabaseAdmin
          .from('leave_requests')
          .select('*');

        if (status) {
          query = query.eq('status', status as string);
        }

        if (employeeId) {
          query = query.eq('employee_id', employeeId as string);
        }

        const { data, error } = await query.order('start_date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const employeeIds = [...new Set(data.map((r: any) => r.employee_id))];
          const { data: employees } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email')
            .in('id', employeeIds);

          const leaveTypeIds = [...new Set(data.map((r: any) => r.leave_type_id).filter(Boolean))];
          const { data: leaveTypes } = await supabaseAdmin
            .from('leave_types')
            .select('id, name')
            .in('id', leaveTypeIds);

          if (employees) {
            const employeeMap = new Map(employees.map((e: any) => [e.id, e]));
            const leaveTypeMap = new Map((leaveTypes || []).map((lt: any) => [lt.id, lt]));
            
            const enrichedData = data.map((request: any) => ({
              ...request,
              employee: employeeMap.get(request.employee_id),
              leave_type: leaveTypeMap.get(request.leave_type_id),
            }));
            
            return res.status(200).json(enrichedData);
          }
        }

        return res.status(200).json(data || []);
      }
    }

    // /api/admin/leave/approve
    if (path === '/leave/approve' || path.startsWith('/leave/approve?')) {
      if (req.method === 'PATCH') {
        const { leaveRequestId, adminComment } = req.body;
        if (!leaveRequestId) {
          return res.status(400).json({ error: 'Missing leaveRequestId' });
        }

        try {
          // Get the leave request details
          const { data: leaveRequest, error: fetchError } = await supabaseAdmin
            .from('leave_requests')
            .select('*')
            .eq('id', leaveRequestId)
            .single();

          if (fetchError || !leaveRequest) {
            console.error('[Approve] Fetch error:', fetchError);
            return res.status(404).json({ error: 'Leave request not found' });
          }

          // Calculate days excluding holidays
          const startDate = new Date(leaveRequest.start_date);
          const endDate = new Date(leaveRequest.end_date);
          
          // Fetch employee's holidays
          const { data: recurringHolidays } = await supabaseAdmin
            .from('employee_recurring_holidays')
            .select('day_of_week')
            .eq('employee_id', leaveRequest.employee_id);

          const { data: specificHolidays } = await supabaseAdmin
            .from('employee_specific_holidays')
            .select('holiday_date')
            .eq('employee_id', leaveRequest.employee_id);

          const recurringDays = recurringHolidays?.map(h => h.day_of_week) || [];
          const specificDates = specificHolidays?.map(h => h.holiday_date) || [];
          
          let workingDays = 0;
          const currentDate = new Date(startDate);
          
          // Iterate through each day and count only working days
          while (currentDate <= endDate) {
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
          
          const days = workingDays;

          // Update leave request status
          const { error: updateError } = await supabaseAdmin
            .from('leave_requests')
            .update({
              status: 'approved',
              admin_comment: adminComment,
              reviewed_at: new Date().toISOString(),
              reviewed_by: userId
            })
            .eq('id', leaveRequestId);

          if (updateError) {
            console.error('[Approve] Update error:', updateError);
            throw updateError;
          }

          // Try to update employee leave balance (don't fail if balance doesn't exist)
          try {
            const year = startDate.getFullYear();
            const { data: balance } = await supabaseAdmin
              .from('employee_leave_balance')
              .select('*')
              .eq('employee_id', leaveRequest.employee_id)
              .eq('leave_type_id', leaveRequest.leave_type_id)
              .eq('year', year)
              .single();

            if (balance) {
              await supabaseAdmin
                .from('employee_leave_balance')
                .update({
                  used_leaves: (balance.used_leaves || 0) + days,
                  remaining_leaves: (balance.remaining_leaves || 0) - days
                })
                .eq('id', balance.id);
            }
          } catch (balanceError) {
            console.warn('[Approve] Balance update failed (non-critical):', balanceError);
            // Continue anyway - balance update is optional
          }

          return res.status(200).json({ success: true });
        } catch (error: any) {
          console.error('[Approve] Error:', error);
          return res.status(500).json({ error: error.message || 'Failed to approve leave' });
        }
      }
    }

    // /api/admin/leave/reject
    if (path === '/leave/reject' || path.startsWith('/leave/reject?')) {
      if (req.method === 'PATCH') {
        const { leaveRequestId, adminComment } = req.body;
        if (!leaveRequestId || !adminComment) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error } = await supabaseAdmin
          .from('leave_requests')
          .update({
            status: 'rejected',
            admin_comment: adminComment,
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId
          })
          .eq('id', leaveRequestId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    }

    // /api/admin/leave/analytics
    if (path === '/leave/analytics' || path.startsWith('/leave/analytics?')) {
      if (req.method === 'GET') {
        const { data: requests } = await supabaseAdmin
          .from('leave_requests')
          .select('*');

        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const analytics = {
          total_requests: requests?.length || 0,
          pending_requests: requests?.filter((r: any) => r.status === 'pending').length || 0,
          approved_requests: requests?.filter((r: any) => r.status === 'approved').length || 0,
          rejected_requests: requests?.filter((r: any) => r.status === 'rejected').length || 0,
          employees_on_leave_today: requests?.filter((r: any) => 
            r.status === 'approved' && 
            r.start_date <= today && 
            r.end_date >= today
          ).length || 0,
          leaves_this_month: requests?.filter((r: any) => {
            const startDate = new Date(r.start_date);
            return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
          }).length || 0,
        };

        return res.status(200).json(analytics);
      }
    }

    // /api/admin/leave/employees-on-leave
    if (path === '/leave/employees-on-leave' || path.startsWith('/leave/employees-on-leave?')) {
      if (req.method === 'GET') {
        try {
          console.log('[DEBUG] Starting employees-on-leave endpoint');
          
          const today = new Date().toISOString().split('T')[0];
          console.log('[DEBUG] Today date:', today);
          
          // Simplified query - just get the data without joins
          console.log('[DEBUG] Querying leave_requests...');
          const { data, error } = await supabaseAdmin
            .from('leave_requests')
            .select('*')
            .eq('status', 'approved')
            .lte('start_date', today)
            .gte('end_date', today);

          console.log('[DEBUG] Query error:', error);
          console.log('[DEBUG] Query data count:', data?.length || 0);

          if (error) {
            console.error('[DEBUG] Database error:', error.message, error.code);
            return res.status(500).json({ 
              error: `Database error: ${error.message}`,
              code: error.code 
            });
          }

          // Return raw data without enrichment to test
          console.log('[DEBUG] Returning data:', data?.length || 0, 'records');
          return res.status(200).json(data || []);
        } catch (err: any) {
          console.error('[DEBUG] Exception in endpoint:', err);
          return res.status(500).json({ 
            error: `Exception: ${err.message}`,
            type: err.constructor.name
          });
        }
      }
    }

    return res.status(404).json({ error: 'Route not found', path });
  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
