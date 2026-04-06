import { LeaveService } from '../../services/leave.service';

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

      // Validate dates format and legitimacy
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      // Validate that the date strings represent real dates
      const start = new Date(startDate + 'T00:00:00Z');
      const end = new Date(endDate + 'T00:00:00Z');
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid dates' });
      }

      // Check if the parsed day matches the input day (catches April 31st, Feb 30th, etc)
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      
      if (startDay !== start.getUTCDate() || endDay !== end.getUTCDate()) {
        return res.status(400).json({ error: 'Invalid date: day does not exist in that month' });
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
