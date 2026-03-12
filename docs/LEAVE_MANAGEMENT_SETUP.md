# Leave Management System - Implementation Guide

## Overview
This guide covers the complete implementation of the Leave Management System for Nexus Attendo, including database setup, backend APIs, and frontend components.

## Database Setup

### 1. Execute SQL Schema
Run the SQL migration in your Supabase dashboard:

```sql
-- File: docs/database/leave_management_schema.sql
```

This creates:
- `leave_types` - Types of leave (Annual, Sick, Compassionate, Unpaid)
- `employee_leave_balance` - Employee leave balance tracking
- `leave_requests` - Leave request records
- `leave_policies` - Leave policy guidelines

### 2. Initialize Leave Balance for Employees
After creating the schema, initialize leave balance for all employees:

```sql
INSERT INTO employee_leave_balance (employee_id, leave_type_id, total_leaves, used_leaves, remaining_leaves, year)
SELECT 
  p.id,
  lt.id,
  lt.max_per_year,
  0,
  lt.max_per_year,
  EXTRACT(YEAR FROM NOW())::INTEGER
FROM profiles p
CROSS JOIN leave_types lt
WHERE p.role = 'employee'
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
```

## Backend Setup

### 1. API Endpoints

#### Employee Endpoints
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/my-requests` - Get employee's leave requests
- `GET /api/leave/balance` - Get leave balance
- `GET /api/leave/policies` - Get leave types and policies

#### Admin Endpoints
- `GET /api/admin/leave/requests` - Get all leave requests
- `PATCH /api/admin/leave/approve` - Approve leave request
- `PATCH /api/admin/leave/reject` - Reject leave request
- `GET /api/admin/leave/employees-on-leave` - Get employees on leave today
- `GET /api/admin/leave/analytics` - Get leave analytics

### 2. Services
The `LeaveService` in `server/services/leave.service.ts` handles all business logic:
- Leave balance validation
- Overlapping leave detection
- Leave request approval/rejection
- Analytics calculation

### 3. Authentication
All endpoints require:
- `x-user-id` header - User's UUID
- `x-user-role` header - User's role (admin/employee)

Admin endpoints verify the user role is 'admin'.

## Frontend Setup

### 1. React Query Hooks
Located in `src/hooks/useLeave.ts`:

```typescript
// Employee hooks
useLeaveTypes()
useLeaveBalance(year?)
useLeavePolicies()
useEmployeeLeaveRequests()
useApplyForLeave()

// Admin hooks
useAllLeaveRequests(filters?)
useApproveLeave()
useRejectLeave()
useEmployeesOnLeaveToday()
useLeaveAnalytics()
```

### 2. Components

#### Employee Components
- `LeaveDashboard` - Main employee leave dashboard
- `LeaveBalanceCard` - Display leave balance
- `PolicyGuideCard` - Display leave policies
- `WhosOutToday` - Show employees on leave
- `LeaveHistoryTable` - Employee's leave history
- `ApplyLeaveModal` - Form to apply for leave

#### Admin Components
- `AdminLeaveDashboard` - Main admin dashboard
- `LeaveAnalyticsCards` - Statistics cards
- `AdminLeaveRequestsTable` - Manage leave requests

### 3. Pages
- `src/pages/LeaveManagement.tsx` - Employee leave page
- `src/pages/admin/LeaveManagement.tsx` - Admin leave page

## Integration Steps

### 1. Update Routing
Add routes to your router configuration:

```typescript
// Employee routes
{
  path: '/leave',
  element: <LeaveManagement />,
  requiresAuth: true,
}

// Admin routes
{
  path: '/admin/leave',
  element: <AdminLeaveManagement />,
  requiresAuth: true,
  requiresAdmin: true,
}
```

### 2. Update Navigation
Add menu items to your navigation:

```typescript
// Employee sidebar
{
  label: 'Leave Management',
  icon: <CalendarIcon />,
  path: '/leave',
}

// Admin sidebar
{
  label: 'Leave Management',
  icon: <CalendarIcon />,
  path: '/admin/leave',
}
```

### 3. Update Vite Config
Ensure the API middleware in `vite.config.ts` includes the leave endpoints:

```typescript
if (req.url?.startsWith('/api/leave') || req.url?.startsWith('/api/admin/leave')) {
  // Routes are handled by the generic router
}
```

## Features

### Employee Features
1. **Dashboard**
   - View leave balance for each leave type
   - See leave policies
   - View who's out today
   - Quick apply button

2. **Apply for Leave**
   - Select leave type
   - Choose start and end dates
   - Add reason
   - Validation for:
     - Future dates only
     - No overlapping leaves
     - Sufficient balance

3. **My History**
   - View all leave requests
   - See status (pending/approved/rejected)
   - View admin comments

### Admin Features
1. **Dashboard**
   - Total leave requests count
   - Pending requests count
   - Employees on leave today
   - Leaves this month
   - Recent requests table
   - Who's out today

2. **Leave Requests**
   - View all leave requests
   - Filter by status
   - Approve/reject requests
   - Add comments

3. **Pending Approvals**
   - View only pending requests
   - Quick approve/reject actions

4. **Team Calendar**
   - Visual calendar view (coming soon)

## Business Logic

### Leave Balance Calculation
- Total leaves = max_per_year from leave_types
- Used leaves = sum of approved leave days
- Remaining leaves = total - used

### Leave Request Validation
1. Start date must be in future
2. End date must be after start date
3. No overlapping approved leaves
4. Employee must have sufficient balance

### Approval Process
1. Admin approves request
2. Leave balance is updated:
   - used_leaves += days
   - remaining_leaves -= days
3. Status changes to 'approved'

### Rejection Process
1. Admin rejects request
2. Status changes to 'rejected'
3. Admin comment is saved
4. Leave balance remains unchanged

## Error Handling

The system handles:
- Insufficient leave balance
- Overlapping leave requests
- Invalid date ranges
- Unauthorized access
- Database errors

All errors return appropriate HTTP status codes and error messages.

## Testing

### Test Employee Leave Application
1. Login as employee
2. Navigate to Leave Management
3. Click "Apply for Leave"
4. Fill form and submit
5. Verify request appears in "My History"

### Test Admin Approval
1. Login as admin
2. Navigate to Admin > Leave Management
3. View pending requests
4. Approve/reject with comment
5. Verify employee balance updates

## Troubleshooting

### Leave Balance Not Showing
- Verify employee_leave_balance records exist
- Check year matches current year
- Verify RLS policies allow access

### Cannot Apply for Leave
- Check leave balance is sufficient
- Verify no overlapping approved leaves
- Ensure dates are in future

### Admin Cannot Approve
- Verify user role is 'admin'
- Check x-user-role header is set
- Verify leave request exists

## Future Enhancements

1. Team Calendar - Visual calendar view of all leaves
2. Leave Carryover - Automatic carryover logic
3. Notifications - Email notifications for approvals
4. Reports - Leave analytics and reports
5. Bulk Operations - Bulk approve/reject
6. Leave Policies - Dynamic policy management
