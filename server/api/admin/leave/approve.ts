import { LeaveService } from '../../../services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    console.log('[Approve Leave] Request received');
    console.log('[Approve Leave] userId:', userId);
    console.log('[Approve Leave] userRole:', userRole);

    if (!userId || userRole !== 'admin') {
      console.log('[Approve Leave] Forbidden - not admin');
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'PATCH') {
      const { leaveRequestId, adminComment } = req.body;

      console.log('[Approve Leave] leaveRequestId:', leaveRequestId);
      console.log('[Approve Leave] adminComment:', adminComment);

      if (!leaveRequestId) {
        return res.status(400).json({ error: 'Missing leaveRequestId' });
      }

      console.log('[Approve Leave] Calling LeaveService.approveLeaveRequest');
      await LeaveService.approveLeaveRequest(leaveRequestId, adminComment);
      
      console.log('[Approve Leave] Successfully approved leave request:', leaveRequestId);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[Approve Leave] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve leave' });
  }
}
