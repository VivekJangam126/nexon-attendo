import { LeaveService } from '../../services/leave.service';
import { supabaseAdmin } from '../../supabase/client';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];
      const employeeId = req.query.employeeId;
      
      console.log('[Balance API] Request received');
      console.log('[Balance API] userId:', userId);
      console.log('[Balance API] userRole:', userRole);
      console.log('[Balance API] employeeId:', employeeId);
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: No user ID' });
      }

      // If employeeId is provided and user is admin, fetch for that employee
      const targetUserId = (employeeId && userRole === 'admin') ? employeeId : userId;
      const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
      
      console.log('[Balance API] targetUserId:', targetUserId);
      console.log('[Balance API] year:', year);
      
      // Initialize balance if it doesn't exist
      const balance = await LeaveService.getEmployeeLeaveBalance(targetUserId, year);
      console.log('[Balance API] LeaveService returned:', balance?.length, 'records');
      
      // Fetch with leave_type details - using explicit filter
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

      console.log('[Balance API] Supabase query error:', error);
      console.log('[Balance API] Supabase query result count:', balanceWithTypes?.length);
      
      if (error) {
        console.error('[Balance API] Error fetching balance with types:', error);
        return res.status(200).json(balance);
      }

      if (!balanceWithTypes || balanceWithTypes.length === 0) {
        console.log('[Balance API] No records found, returning empty array');
        return res.status(200).json([]);
      }

      console.log('[Balance API] Returning', balanceWithTypes.length, 'records for employee:', targetUserId);
      return res.status(200).json(balanceWithTypes);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[Balance API] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch leave balance',
      details: error.toString()
    });
  }
}
