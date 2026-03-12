# Leave Balance Fix Guide

## Problem
Leave balances are not being updated correctly when leaves are approved. For example, Siddhesh Jadhav shows 12 remaining sick leaves even though 12 have been used.

## Root Cause
The `remaining_leaves` field in the `employee_leave_balance` table is not being recalculated based on approved leave requests.

## Solution Steps

### Step 1: Run the Fix Script
Execute the SQL script `FIX_LEAVE_BALANCE_CALCULATION.sql` in your Supabase SQL editor:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `FIX_LEAVE_BALANCE_CALCULATION.sql`
5. Click "Run"

This script will:
- Recalculate `used_leaves` based on all approved leave requests
- Recalculate `remaining_leaves` as `total_leaves - used_leaves`
- Update all employee leave balances

### Step 2: Verify the Fix
After running the script, check Siddhesh Jadhav's leave balance:
- Go to Admin > Employees
- Click on Siddhesh Jadhav
- Check the Leave Balance section
- Sick Leave should now show the correct remaining balance

### Step 3: Check Server Logs
When approving future leave requests, check the server logs for:
```
[approveLeaveRequest] Leave days: X Year: YYYY
[approveLeaveRequest] Updating balance: {...}
```

This confirms the balance is being updated.

## How It Works Now

### When a Leave is Approved:
1. The system calculates the number of leave days
2. Updates `used_leaves = old_used_leaves + new_days`
3. Updates `remaining_leaves = total_leaves - new_used_leaves`
4. Logs the changes for debugging

### Display Logic:
- If `remaining_leaves = 0`: Shows "No leaves left" (red)
- If `remaining_leaves <= 2`: Shows "Running low" (orange)
- If `remaining_leaves > 2`: Shows "Healthy balance" (green)

## Files Modified

1. **leave.service.ts** - Fixed the `approveLeaveRequest` function
2. **approve.ts** - Added comprehensive logging
3. **EmployeeLeaveBalanceCards.tsx** - Updated to show correct status
4. **useLeave.ts** - Disabled caching for fresh data

## Testing

To test if it's working:
1. Create a new leave request for an employee
2. Approve it from the admin panel
3. Check the employee's profile
4. The remaining leaves should decrease
5. Check server logs to see the calculation details

## If Still Not Working

1. Check if the leave request is actually marked as "approved" in the database
2. Verify the leave_type_id matches between leave_requests and employee_leave_balance
3. Check if the year in the leave request matches the year in employee_leave_balance
4. Run the diagnostic query in `CHECK_SIDDHESH_LEAVE.sql` to see the actual data
