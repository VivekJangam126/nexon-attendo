import { LeaveService } from '../../server/services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'POST') {
      const userId = req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { leaveTypeId, startDate, endDate, reason } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const leaveRequest = await LeaveService.applyForLeave(
        userId,
        leaveTypeId,
        startDate,
        endDate,
        reason
      );

      return res.status(201).json(leaveRequest);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to apply for leave' });
  }
}
