# Holiday and Leave Absence Fix

## Problem
Employees were being marked as absent on days when:
1. Admin had declared holidays for them (e.g., Saturday/Sunday for interns)
2. They had approved leave requests

The attendance system wasn't checking the holiday calendar or leave requests before counting absences.

## Solution Implemented

### 1. Dashboard Service Update (`server/services/dashboard.service.ts`)
- Added holiday AND leave checking logic to `getDashboardStats()` function
- Now queries:
  - `employee_recurring_holidays` (weekly holidays like Sat/Sun)
  - `employee_specific_holidays` (specific dates like festivals)
  - `leave_requests` (approved leaves)
- Excludes employees on holiday/leave from:
  - Total employee count (shows only working employees)
  - Absent count (holidays/leaves are not absences)
  - "Not Marked" count (holidays/leaves don't need attendance)
- Attendance rate calculation now based on working employees only

### 2. Reports Service Update (`server/services/reports.service.ts`)
- Updated `getEmployeeAttendanceRecords()` function
- Checks holidays AND approved leaves for each date in the report range
- Employees on holiday/leave show:
  - Check-in time: "Holiday" or "On Leave: [Leave Type]"
  - Status: "holiday"
  - NOT marked as absent

### 3. How It Works

**Recurring Holidays (Weekly):**
- Stored in `employee_recurring_holidays` table
- `day_of_week`: 0=Sunday, 1=Monday, ..., 6=Saturday
- Example: Interns with Saturday/Sunday off

**Specific Holidays (Dates):**
- Stored in `employee_specific_holidays` table
- Specific dates like festivals, company events
- Example: Holi, Diwali, Independence Day

**Approved Leaves:**
- Stored in `leave_requests` table with status='approved'
- Date range: start_date to end_date
- Example: Employee on sick leave for 3 days

**Database Function:**
- `is_employee_holiday(employee_id, date)` checks both holiday types
- Leave requests checked separately with date range query

## Behavior After Fix

### Scenario 1: Employee on Holiday (No Attendance)
- Dashboard: NOT counted as absent
- Reports: Shows "Holiday" status
- Attendance rate: Not affected

### Scenario 2: Employee on Approved Leave (No Attendance)
- Dashboard: NOT counted as absent
- Reports: Shows "On Leave: [Leave Type]" status
- Attendance rate: Not affected
- Leave balance: Already deducted when approved

### Scenario 3: Employee Comes on Holiday/Leave Day
- If they mark attendance: Shows as present/late (normal)
- Attendance is allowed and recorded
- Counts toward attendance rate

### Scenario 4: Regular Working Day (No Attendance)
- After grace period: Counted as absent
- Shows in reports as absent
- Affects attendance rate

## Testing

Run `CHECK_LEAVE_AND_HOLIDAY_STATUS.sql` to verify:
1. Which employees have approved leaves today
2. Which employees have recurring holidays today
3. Which employees have specific holidays today
4. Complete status for all employees
5. Summary counts
6. Weekend (Sat/Sun) status for last 7 days

## Key Points

✅ Holidays are NOT counted as absences
✅ Approved leaves are NOT counted as absences
✅ Employees CAN mark attendance on their holidays/leaves (if they come to work)
✅ Dashboard shows accurate working employee count
✅ Reports distinguish between absent, holiday, and leave
✅ Attendance rate calculated correctly (excludes holidays and leaves)

## Files Modified

1. `server/services/dashboard.service.ts` - Dashboard stats calculation (includes leave check)
2. `server/services/reports.service.ts` - Attendance reports generation (includes leave check)
3. `CHECK_LEAVE_AND_HOLIDAY_STATUS.sql` - Comprehensive verification queries (new)
4. `CHECK_HOLIDAY_SETUP.sql` - Holiday-only verification queries (previous)
