import { LeaveService } from '../../server/services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    console.log('my-requests handler called with method:', req.method);
    console.log('my-requests headers:', req.headers);
    
    if (req.method === 'GET') {
      const userId = req.headers['x-user-id'];
      console.log('my-requests userId:', userId);
      
      if (!userId) {
        console.log('my-requests: No userId provided');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('my-requests: Fetching requests for user:', userId);
      const requests = await LeaveService.getEmployeeLeaveRequests(userId);
      console.log('my-requests: Got requests:', requests);
      return res.status(200).json(requests || []);
    }

    console.log('my-requests: Method not allowed:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Exception in my-requests:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch leave requests' });
  }
}
