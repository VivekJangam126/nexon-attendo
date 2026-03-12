# New Leave System - Deployment Checklist

## Pre-Deployment

- [ ] Backup current database
- [ ] Review all changes in this document
- [ ] Ensure all team members are aware of the changes

## Database Setup

- [ ] Open Supabase SQL Editor
- [ ] Run `SETUP_NEW_LEAVE_SYSTEM.sql`
- [ ] Verify output shows 3 leave types (Sick: 5, Paid: 10, Unpaid: 10)
- [ ] Run `VERIFY_NEW_LEAVE_SYSTEM.sql` to confirm setup
- [ ] Check that all active employees have leave balance records

## Code Deployment

- [ ] Deploy updated `LeaveBalanceCardsNew.tsx`
- [ ] Deploy updated `EmployeeLeaveBalanceCards.tsx`
- [ ] Deploy updated `leave.service.ts`
- [ ] Deploy updated `approve.ts`
- [ ] Clear browser cache

## Testing - Employee Side

- [ ] Employee logs in
- [ ] Navigate to Leave Management page
- [ ] Verify 3 leave cards are displayed (Sick, Paid, Unpaid)
- [ ] Verify each card shows correct allocation:
  - Sick Leave: 5 days
  - Paid Leave: 10 days
  - Unpaid Leave: 10 days
- [ ] Verify total is 25 days
- [ ] Click "Apply for Leave"
- [ ] Verify dropdown shows only 3 leave types
- [ ] Select a leave type
- [ ] Verify balance info is displayed correctly
- [ ] Submit a leave request
- [ ] Verify request appears in Leave Requests table

## Testing - Admin Side

- [ ] Admin logs in
- [ ] Navigate to Employees
- [ ] Click on an employee
- [ ] Scroll to Leave Balance section
- [ ] Verify 3 leave cards are displayed
- [ ] Verify balances match employee's view
- [ ] Go to Leave Management tab
- [ ] Verify leave requests are visible
- [ ] Approve a leave request
- [ ] Go back to employee profile
- [ ] Verify leave balance decreased

## Testing - Leave Approval

- [ ] Employee submits a leave request
- [ ] Admin approves the request
- [ ] Check employee's leave balance:
  - Used leaves should increase
  - Remaining leaves should decrease
- [ ] Verify status changes appropriately:
  - Healthy balance (> 2 days)
  - Running low (≤ 2 days)
  - No leaves left (0 days)

## Testing - Edge Cases

- [ ] Employee with 0 remaining leaves tries to apply
- [ ] Verify error message: "Insufficient leave balance"
- [ ] Employee with 2 remaining leaves
- [ ] Verify status shows "Running low"
- [ ] Employee with 0 remaining leaves
- [ ] Verify status shows "No leaves left"

## Post-Deployment

- [ ] Monitor server logs for errors
- [ ] Check database for any inconsistencies
- [ ] Communicate changes to all employees
- [ ] Update documentation if needed
- [ ] Archive old leave system documentation

## Rollback Plan (if needed)

- [ ] Restore database from backup
- [ ] Revert code changes
- [ ] Clear browser cache
- [ ] Notify team of rollback

## Sign-Off

- [ ] QA Team: _______________  Date: _______
- [ ] Admin: _______________  Date: _______
- [ ] Developer: _______________  Date: _______

## Notes

- Annual Leave has been completely removed
- Total annual leave allocation is now 25 days (Sick: 5, Paid: 10, Unpaid: 10)
- All employees must have leave balance initialized
- Leave requests with old leave types should be handled separately
