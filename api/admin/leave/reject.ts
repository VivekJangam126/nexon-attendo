import { LeaveService } from '../../../server/services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'PATCH') {
      const { leaveRequestId, adminComment } = req.body;

      if (!leaveRequestId || !adminComment) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await LeaveService.rejectLeaveRequest(leaveRequestId, adminComment);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Reject leave error:', error);
    res.status(500).json({ error: 'Failed to reject leave' });
  }
}
