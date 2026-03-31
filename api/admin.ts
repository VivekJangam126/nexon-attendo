import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY5MTg1NCwiZXhwIjoyMDg2MjY3ODU0fQ.846KQ7v9nbH5-4COTqEgBGrboFFKrTG7w3AGPP4uIqk';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

        const { error } = await supabaseAdmin
          .from('leave_requests')
          .update({
            status: 'approved',
            admin_comment: adminComment,
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId
          })
          .eq('id', leaveRequestId);

        if (error) throw error;
        return res.status(200).json({ success: true });
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

    return res.status(404).json({ error: 'Route not found', path });
  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
