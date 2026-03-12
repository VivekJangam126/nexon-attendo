import { LeaveService } from '../../../services/leave.service';
import { supabase } from '../../../supabase/client';

export default async function handler(req: any, res: any) {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
      const year = req.body.year || new Date().getFullYear();

      // Get all active employees
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'employee')
        .eq('status', 'active');

      if (employeesError) throw employeesError;

      // Get all leave types
      const { data: leaveTypes, error: typesError } = await supabase
        .from('leave_types')
        .select('*');

      if (typesError) throw typesError;

      let initialized = 0;
      let skipped = 0;

      // Initialize balance for each employee
      for (const employee of employees || []) {
        for (const type of leaveTypes || []) {
          const { data, error } = await supabase
            .from('employee_leave_balance')
            .insert({
              employee_id: employee.id,
              leave_type_id: type.id,
              total_leaves: type.max_per_year,
              used_leaves: 0,
              remaining_leaves: type.max_per_year,
              year,
            })
            .select()
            .single();

          if (error && error.code === 'PGRST116') {
            // Conflict - already exists
            skipped++;
          } else if (error) {
            throw error;
          } else if (data) {
            initialized++;
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `Leave balance initialized for ${year}`,
        initialized,
        skipped,
        totalEmployees: employees?.length || 0,
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Initialize leave balance error:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize leave balance' });
  }
}
