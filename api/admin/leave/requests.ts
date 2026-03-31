import { LeaveService } from '../../../server/services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    console.log('📋 [LEAVE REQUESTS] Handler called');
    console.log('  Headers:', req.headers);
    console.log('  Query:', req.query);
    
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    console.log('  User ID:', userId);
    console.log('  User Role:', userRole);

    if (!userId || userRole !== 'admin') {
      console.log('  ❌ Forbidden: Missing userId or not admin');
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const { status, employeeId } = req.query;
      console.log('  Fetching requests with filters:', { status, employeeId });
      
      const requests = await LeaveService.getAllLeaveRequests({
        status: status as string,
        employeeId: employeeId as string,
      });

      console.log('  ✅ Found', requests.length, 'requests');
      return res.status(200).json(requests);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('❌ Get leave requests error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch leave requests' });
  }
}
