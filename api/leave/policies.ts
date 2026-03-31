import { LeaveService } from '../../server/services/leave.service';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const [policies, types] = await Promise.all([
        LeaveService.getLeavePolicies(),
        LeaveService.getLeaveTypes(),
      ]);

      return res.status(200).json({ policies, types });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Get policies error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch policies' });
  }
}
