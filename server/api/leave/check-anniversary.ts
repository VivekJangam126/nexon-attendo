import { LeaveAnniversaryService } from '../../services/leave-anniversary.service';

/**
 * API Endpoint: Check Leave Anniversary
 * Triggers anniversary check to reset leave balance if employment year has passed
 * Called by frontend when user opens leave page
 */
export default async function handler(req: any, res: any) {
  try {
    const userId = req.headers['x-user-id'];

    console.log('[check-anniversary] Request received');
    console.log('[check-anniversary] User ID:', userId);

    if (!userId) {
      console.log('[check-anniversary] No user ID provided');
      return res.status(401).json({ error: 'Unauthorized - No user ID' });
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      console.log('[check-anniversary] Invalid method:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[check-anniversary] Checking anniversary for user:', userId);

    // Trigger anniversary check
    const newBalanceCreated = await LeaveAnniversaryService.checkAndResetLeaveBalance(userId);

    console.log('[check-anniversary] Anniversary check complete. New balance created:', newBalanceCreated);

    return res.status(200).json({
      success: true,
      newBalanceCreated,
      message: newBalanceCreated 
        ? 'Leave balance reset for new employment year'
        : 'No reset needed - current year balance exists',
    });
  } catch (error: any) {
    console.error('[check-anniversary] Error in handler:', error);
    console.error('[check-anniversary] Error message:', error.message);
    console.error('[check-anniversary] Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check anniversary',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
