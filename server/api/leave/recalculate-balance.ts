import { LeaveService } from '../../services/leave.service';
import { supabaseAdmin } from '../../supabase/client';

/**
 * API Handler: Recalculate Leave Balance
 * Recalculates leave balance based on actual approved leave requests
 * Useful when leave requests are deleted or modified outside the normal flow
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Recalculate Balance API] Request received:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });

    const { employeeId } = req.body;

    if (!employeeId) {
      console.log('[Recalculate Balance API] Missing employeeId');
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    console.log('[Recalculate Balance API] Recalculating balance for employee:', employeeId);

    // Verify employee exists
    console.log('[Recalculate Balance API] Verifying employee exists...');
    const { data: employee, error: employeeError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', employeeId)
      .single();

    if (employeeError) {
      console.error('[Recalculate Balance API] Employee fetch error:', employeeError);
      return res.status(404).json({ error: 'Employee not found', details: employeeError.message });
    }

    if (!employee) {
      console.log('[Recalculate Balance API] Employee not found');
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log('[Recalculate Balance API] Employee found:', employee.full_name);

    // Recalculate leave balance
    console.log('[Recalculate Balance API] Calling LeaveService.recalculateLeaveBalance...');
    const result = await LeaveService.recalculateLeaveBalance(employeeId);

    console.log('[Recalculate Balance API] Service result:', result);

    if (result.success) {
      console.log('[Recalculate Balance API] Success:', result.message);
      return res.status(200).json({
        success: true,
        message: result.message,
        balances: result.balances,
        employee: employee.full_name
      });
    } else {
      console.error('[Recalculate Balance API] Service failed:', result.message);
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }

  } catch (error: any) {
    console.error('[Recalculate Balance API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      error: error.message || 'Failed to recalculate leave balance',
      details: error.stack
    });
  }
}
