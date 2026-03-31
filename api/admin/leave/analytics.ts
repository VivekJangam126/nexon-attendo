import { LeaveService } from '../../../server/services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const analytics = await LeaveService.getLeaveAnalytics();
      return res.status(200).json(analytics);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
}
