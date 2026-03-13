import type { Request, Response } from 'express';
import { createAuthenticatedClient } from '../../supabase/api-client';

/**
 * POST /api/holidays/year-reset
 * Manually trigger year-end holiday reset (admin only)
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createAuthenticatedClient(req, res);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Call the year reset function
    const { error: resetError } = await supabase.rpc('manual_year_reset');

    if (resetError) {
      console.error('[Year Reset] Error:', resetError);
      return res.status(500).json({ error: 'Failed to reset holidays' });
    }

    // Get count of remaining holidays
    const { count: specificCount } = await supabase
      .from('employee_specific_holidays')
      .select('*', { count: 'exact', head: true });

    const { count: recurringCount } = await supabase
      .from('employee_recurring_holidays')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      message: 'Holiday year reset completed successfully',
      remaining_holidays: {
        specific: specificCount || 0,
        recurring: recurringCount || 0
      }
    });
  } catch (error) {
    console.error('[Year Reset] Exception:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
