# New Leave System Setup Guide

## Overview
The leave system has been updated to include only 3 leave types per year:
- **Sick Leave**: 5 days
- **Paid Leave**: 10 days  
- **Unpaid Leave**: 10 days
- **Total**: 25 days per year

## Setup Steps

### Step 1: Update Leave Types in Database
Run this SQL script in Supabase SQL Editor:

```sql
-- Delete all existing leave types
DELETE FROM leave_types;

-- Insert new leave types with correct allocations
INSERT INTO leave_types (name, max_per_year) VALUES
  ('Sick Leave', 5),
  ('Paid Leave', 10),
  ('Unpaid Leave', 10);

-- Verify
SELECT id, name, max_per_year FROM leave_types ORDER BY name;
```

### Step 2: Initialize Leave Balance for All Employees
Run this SQL script:

```sql
-- Initialize leave balance for all active employees
INSERT INTO employee_leave_balance (employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, year)
SELECT 
  p.id as employee_id,
  lt.id as leave_type_id,
  lt.max_per_year as total_leaves,
  0 as used_leaves,
  lt.max_per_year as remaining_leaves,
  EXTRACT(YEAR FROM NOW())::INTEGER as year
FROM profiles p
CROSS JOIN leave_types lt
WHERE p.role = 'employee'
  AND p.status = 'active'
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

-- Verify
SELECT 
  p.full_name,
  lt.name,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;
```

## Where Leave Balance is Displayed

### 1. Employee Dashboard (Login Page)
- Path: `/leave-management`
- Shows: 3 leave cards (Sick, Paid, Unpaid)
- Each card displays:
  - Leave type name
  - Remaining days
  - Total days
  - Usage percentage
  - Status (Healthy balance, Running low, No leaves left)

### 2. Admin Employee Profile
- Path: `/admin/employees/{id}`
- Shows: Same 3 leave cards as employee dashboard
- Located in the right column below Monthly Statistics

### 3. Apply for Leave Modal
- Available on both employee and admin pages
- Dropdown shows only: Sick Leave, Paid Leave, Unpaid Leave
- Shows current balance for selected leave type

## Files Modified

1. **LeaveBalanceCardsNew.tsx** - Updated to show only 3 leave types
2. **EmployeeLeaveBalanceCards.tsx** - Updated to show only 3 leave types
3. **ApplyLeaveModal.tsx** - Already uses database leave types (no changes needed)
4. **leave.service.ts** - Fixed balance calculation logic
5. **approve.ts** - Added logging for debugging

## Testing Checklist

- [ ] Run the SQL scripts to set up leave types
- [ ] Employee logs in and sees 3 leave cards on dashboard
- [ ] Each card shows correct allocation (Sick: 5, Paid: 10, Unpaid: 10)
- [ ] Admin clicks on employee profile and sees same 3 leave cards
- [ ] Apply for Leave modal shows only 3 leave types in dropdown
- [ ] When leave is approved, remaining balance decreases
- [ ] Status changes to "Running low" when ≤2 days remaining
- [ ] Status changes to "No leaves left" when 0 days remaining

## Troubleshooting

### Leave cards not showing?
1. Check if leave_types table has 3 records
2. Check if employee_leave_balance table has records for the employee
3. Clear browser cache and refresh

### Leave balance not updating after approval?
1. Check server logs for approval confirmation
2. Run the diagnostic query to verify database records
3. Manually refresh the page

### Dropdown showing wrong leave types?
1. Verify leave_types table only has 3 records
2. Clear browser cache
3. Refresh the page

## Database Queries for Verification

```sql
-- Check leave types
SELECT id, name, max_per_year FROM leave_types;

-- Check employee leave balance
SELECT 
  p.full_name,
  lt.name,
  elb.total_leaves,
  elb.used_leaves,
  elb.remaining_leaves
FROM employee_leave_balance elb
JOIN profiles p ON elb.employee_id = p.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- Check approved leaves for an employee
SELECT 
  p.full_name,
  lt.name,
  lr.start_date,
  lr.end_date,
  CEIL((lr.end_date::date - lr.start_date::date) + 1) as days,
  lr.status
FROM leave_requests lr
JOIN profiles p ON lr.employee_id = p.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.status = 'approved'
ORDER BY p.full_name, lr.start_date DESC;
```
