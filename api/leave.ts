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
  const path = req.url?.replace('/api/leave', '') || '/';
  
  console.log('[Leave API] Request:', req.method, path);

  try {
    // /api/leave/my-requests
    if (path === '/my-requests' || path.startsWith('/my-requests?')) {
      if (req.method === 'GET') {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { data, error } = await supabaseAdmin
          .from('leave_requests')
          .select('*')
          .eq('employee_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
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

    return res.status(404).json({ error: 'Route not found', path });
  } catch (error: any) {
    console.error('[Leave API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
