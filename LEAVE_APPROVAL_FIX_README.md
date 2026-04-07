# Leave Approval Error Fix Guide

## Problem
When attempting to approve a leave request from the admin panel, you get a **500 (Internal Server Error)** with the message: "Failed to approve leave"

## Root Cause
The `leave_requests` table is missing two critical columns that the approval API endpoint tries to set:
- `reviewed_at` - timestamp when the leave was reviewed
- `reviewed_by` - UUID reference to the admin who reviewed it

When the API tries to update these non-existent columns, Supabase rejects the update with a 500 error.

## Solution

### Step 1: Run the SQL Fix
1. Go to your Supabase project dashboard
2. Open **SQL Editor**
3. Create a new query and paste the contents of `FIX_LEAVE_APPROVE_COLUMNS.sql`
4. Click **Run** to execute

This will:
- Add `reviewed_at` column (timestamp)
- Add `reviewed_by` column (foreign key to profiles table)
- Verify the columns exist

### Step 2: Verify the Fix
After running the SQL, test the leave approval again:
1. Go to Admin Panel → Leave Management
2. Find a pending leave request
3. Click "Approve" 
4. Leave approval should now succeed

## What Changed
The `leave_requests` table previously had:
```sql
id, employee_id, leave_type_id, start_date, end_date, reason, status, admin_comment, created_at, updated_at
```

It now has:
```sql
id, employee_id, leave_type_id, start_date, end_date, reason, status, admin_comment, reviewed_at, reviewed_by, created_at, updated_at
```

## Related Code
The approval endpoint is in `api/admin.ts` at `/api/admin/leave/approve` (PATCH method):
- Fetches the leave request
- Calculates number of days
- Updates status to 'approved'
- Updates `reviewed_at` and `reviewed_by` ← These fields now exist
- Updates employee leave balance

## Additional Notes
- No existing data will be lost
- The columns are nullable, so existing records will have `NULL` for these fields
- You may want to run the fix immediately if you have pending leave approvals waiting
