import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LeaveService } from '../../../server/services/leave.service';

/**
 * Vercel Serverless Function: Recalculate All Leave Balances (Admin Only)
 * Recalculates leave balance for all active employees
 * Useful when bulk operations are performed on leave requests
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Admin Recalculate All Balances API] Starting bulk recalculation...');

    // Recalculate leave balance for all employees
    const result = await LeaveService.recalculateAllEmployeesBalance();

    if (result.success) {
      console.log('[Admin Recalculate All Balances API] Success:', result.message);
      return res.status(200).json({
        success: true,
        message: result.message,
        results: result.results
      });
    } else {
      console.error('[Admin Recalculate All Balances API] Failed:', result.message);
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }

  } catch (error: any) {
    console.error('[Admin Recalculate All Balances API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to recalculate leave balances'
    });
  }
}