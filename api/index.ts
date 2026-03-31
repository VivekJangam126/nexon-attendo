import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import all handlers
import employeesHandler from './employees';
import holidaysHandler from './holidays';
import userInfoHandler from './user-info';
import sendNotificationHandler from './send-notification';

// Leave handlers
import applyHandler from './leave/apply';
import balanceHandler from './leave/balance';
import myRequestsHandler from './leave/my-requests';
import policiesHandler from './leave/policies';
import recalculateBalanceHandler from './leave/recalculate-balance';

// Admin leave handlers
import analyticsHandler from './admin/leave/analytics';
import approveHandler from './admin/leave/approve';
import employeesOnLeaveHandler from './admin/leave/employees-on-leave';
import rejectHandler from './admin/leave/reject';
import requestsHandler from './admin/leave/requests';
import recalculateAllBalancesHandler from './admin/leave/recalculate-all-balances';

// Holiday handlers
import recurringHolidaysHandler from './holidays/recurring';
import specificHolidaysHandler from './holidays/specific';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace('/api', '') || '/';
  
  console.log('[API Router] Request:', req.method, path);

  try {
    // Root level routes
    if (path === '/employees' || path.startsWith('/employees?')) {
      return employeesHandler(req, res);
    }
    if (path === '/holidays' || path.startsWith('/holidays?')) {
      return holidaysHandler(req, res);
    }
    if (path === '/user-info' || path.startsWith('/user-info?')) {
      return userInfoHandler(req, res);
    }
    if (path === '/send-notification' || path.startsWith('/send-notification?')) {
      return sendNotificationHandler(req, res);
    }

    // Leave routes
    if (path === '/leave/apply' || path.startsWith('/leave/apply?')) {
      return applyHandler(req, res);
    }
    if (path === '/leave/balance' || path.startsWith('/leave/balance?')) {
      return balanceHandler(req, res);
    }
    if (path === '/leave/my-requests' || path.startsWith('/leave/my-requests?')) {
      return myRequestsHandler(req, res);
    }
    if (path === '/leave/policies' || path.startsWith('/leave/policies?')) {
      return policiesHandler(req, res);
    }
    if (path === '/leave/recalculate-balance' || path.startsWith('/leave/recalculate-balance?')) {
      return recalculateBalanceHandler(req, res);
    }

    // Admin leave routes
    if (path === '/admin/leave/analytics' || path.startsWith('/admin/leave/analytics?')) {
      return analyticsHandler(req, res);
    }
    if (path === '/admin/leave/approve' || path.startsWith('/admin/leave/approve?')) {
      return approveHandler(req, res);
    }
    if (path === '/admin/leave/employees-on-leave' || path.startsWith('/admin/leave/employees-on-leave?')) {
      return employeesOnLeaveHandler(req, res);
    }
    if (path === '/admin/leave/reject' || path.startsWith('/admin/leave/reject?')) {
      return rejectHandler(req, res);
    }
    if (path === '/admin/leave/requests' || path.startsWith('/admin/leave/requests?')) {
      return requestsHandler(req, res);
    }
    if (path === '/admin/leave/recalculate-all-balances' || path.startsWith('/admin/leave/recalculate-all-balances?')) {
      return recalculateAllBalancesHandler(req, res);
    }

    // Holiday routes
    if (path === '/holidays/recurring' || path.startsWith('/holidays/recurring?')) {
      return recurringHolidaysHandler(req, res);
    }
    if (path === '/holidays/specific' || path.startsWith('/holidays/specific?')) {
      return specificHolidaysHandler(req, res);
    }

    // Not found
    return res.status(404).json({ error: 'API route not found', path });
  } catch (error: any) {
    console.error('[API Router] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
