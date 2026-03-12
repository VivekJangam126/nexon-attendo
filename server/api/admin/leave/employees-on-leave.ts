import { LeaveService } from '../../../services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const employees = await LeaveService.getEmployeesOnLeaveToday();
      return res.status(200).json(employees);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Get employees on leave error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch employees on leave' });
  }
}
