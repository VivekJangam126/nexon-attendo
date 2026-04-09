# Leave Management System - Comprehensive Analysis

## System Overview

The leave management system is a full-stack application built with **React (frontend)**, **Vercel serverless functions (backend)**, and **Supabase PostgreSQL (database)**. It handles employee leave requests, approvals, and balance tracking with support for multiple leave types and holiday management.

---

## 1. Architecture

### Tech Stack
- **Frontend**: React + TypeScript (Vite), running on localhost:8081
- **Backend**: Vercel serverless functions (Node.js), routes in `/api/` directory
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Query Library**: @tanstack/react-query (data fetching & caching)
- **UI Components**: React UI library with Tailwind CSS

### Request Flow
```
Employee Browser → React Component → API Route (/api/leave/*.ts) → Vercel Function → Supabase DB
```

---

## 2. Database Schema

### Core Tables

#### **leave_types**
Defines available leave categories with annual allocations.
```
- id (UUID, Primary Key)
- name (TEXT, UNIQUE) - "Sick Leave", "Casual Leave", "My Leave"
- max_per_year (INTEGER) - e.g., 6 for Sick Leave, 19 for Casual Leave
```

**Leave Types Currently Active:**
- `33333333-3333-3333-3333-333333333333` → Sick Leave (6 days/year)
- `44444444-4444-4444-4444-444444444444` → Casual Leave (19 days/year)
- `55555555-5555-5555-5555-555555555555` → My Leave (12 days/year, **female employees only**)

---

#### **employee_leave_balance**
Tracks leave allocation and usage per employee per employment year.
```
- id (UUID, Primary Key)
- employee_id (UUID) → profiles.id
- leave_type_id (UUID) → leave_types.id
- total_leaves (INTEGER) - Total allocated for the year
- used_leaves (INTEGER) - Days already used
- remaining_leaves (INTEGER) - remaining_leaves = total - used
- year (INTEGER) - Calendar year
- employment_year_start (DATE) - Anniversary start date
- employment_year_end (DATE) - Next anniversary date
- created_at, updated_at (TIMESTAMPS)
- UNIQUE constraint: (employee_id, leave_type_id, year)
```

**Employment Year Logic**: Uses employee's enrollment anniversary, not calendar year.
- Employee joins on April 15, 2024 → Employment year is Apr 15, 2024 - Apr 14, 2025
- Balance resets automatically on each anniversary via `LeaveAnniversaryService`

---

#### **leave_requests**
Stores individual leave applications and their status.
```
- id (UUID, Primary Key)
- employee_id (UUID) → profiles.id
- leave_type_id (UUID) → leave_types.id
- start_date (DATE)
- end_date (DATE)
- reason (TEXT) - Employee's reason for leave
- status (TEXT) - 'pending' | 'approved' | 'rejected'
- admin_comment (TEXT) - Admin's feedback
- attachment_url (TEXT) - Optional Cloudinary URL for medical certs, etc.
- attachment_type (TEXT) - Type of attachment
- created_at, updated_at (TIMESTAMPS)
```

---

#### **Holiday Tables**

##### **employee_recurring_holidays**
Weekly recurring holidays (e.g., weekends) per employee.
```
- id (UUID, Primary Key)
- employee_id (UUID) → profiles.id
- day_of_week (INTEGER) - 0=Sunday, 1=Monday, ..., 6=Saturday
- UNIQUE constraint: (employee_id, day_of_week)
```

##### **employee_specific_holidays**
One-off holiday dates per employee (company events, personal days).
```
- id (UUID, Primary Key)
- employee_id (UUID) → profiles.id
- holiday_date (DATE)
- holiday_type (TEXT) - 'public_holiday', 'festival', 'company_event', 'other'
- reason (TEXT)
- UNIQUE constraint: (employee_id, holiday_date)
```

##### **master_public_holidays** (referenced in code)
System-wide public holidays (Diwali, Holi, etc.).
```
- id, holiday_date, holiday_name, is_active, created_at
```

---

## 3. Leave Request Lifecycle

### Phase 1: Application (Employee)
**Component**: `ApplyLeaveModal.tsx`
**Flow**:
1. Employee selects leave type (Sick/Casual/My Leave)
2. Picks start and end dates
3. Enters reason and optional medical certificate upload
4. Form displays "X days requested" (simple calculation: date difference + 1)
5. Validates:
   - Dates are in future
   - End date ≥ Start date
   - No overlapping approved leaves
   - My Leave: Only 1 per calendar month per female employee
   - Sufficient leave balance available

**API Call**: `POST /api/leave/apply`
```javascript
{
  leaveTypeId: "33333333-3333-3333-3333-333333333333",
  startDate: "2026-04-10",
  endDate: "2026-04-14",
  reason: "Medical appointment",
  attachmentUrl: "https://cloudinary.../cert.jpg",
  attachmentType: "medical_certificate"
}
```

**Backend Processing** (`server/services/leave.service.ts::applyForLeave`):
1. Validates dates and employee eligibility
2. For "My Leave": Verifies employee gender = 'female', checks monthly limit
3. Checks for overlapping approved leaves
4. Gets current employment year balance via `LeaveAnniversaryService`
5. Calculates leave days: `Math.ceil((endDate - startDate) / (24*60*60*1000)) + 1`
6. Validates sufficient remaining balance
7. Inserts into `leave_requests` table with status='pending'

**Status After Application**: `pending` (awaiting admin approval)

---

### Phase 2: Approval (Admin)
**Component**: `AdminLeaveDashboard` / Admin panel
**Admin Actions**:
- Review pending requests
- Approve or reject
- Add comments

**API Flow**: Many possible endpoints for admin operations
- `GET /api/leave/...` - Fetch requests
- Auth header includes `x-user-role: admin` to bypass RLS

**Backend Processing** (`server/services/leave.service.ts::approveLeaveRequest`):
1. Fetch the leave_request record
2. Validate (e.g., "My Leave" → female employee check)
3. Calculate leave days consumed: `Math.ceil((endDate - startDate) / ms) + 1`
4. Update leave_requests status to 'approved'
5. **Update employee_leave_balance**:
   - Find matching balance record (employee_id, leave_type_id)
   - If exists: Increment used_leaves, decrement remaining_leaves
   - If not exists: Create new balance record with calculated values
6. Log all changes for audit trail

**Example Balance Update**:
```
Before: total=6, used=0, remaining=6
Apply: 3-day leave approved
After: total=6, used=3, remaining=3
```

**Status After Approval**: `approved` (now affects employee's balance)

---

### Phase 3: Rejection (Admin)
**Backend Processing** (`server/services/leave.service.ts::rejectLeaveRequest`):
1. Update leave_requests status to 'rejected'
2. Add admin comment
3. **No balance change** (request never counted)

**Status After Rejection**: `rejected` (ignored in balance calculations)

---

## 4. Leave Balance Queries

### Getting Leave Balance
**API**: `GET /api/leave/balance?year=2026`
**Frontend Hook**: `useLeaveBalance()`

**Backend Flow** (`server/api/leave/balance.ts`):
1. Extract user ID from header
2. Call `LeaveService.getEmployeeLeaveBalance(employeeId, year)`
   - This automatically checks for employment anniversary and creates new balance if needed
3. Query `employee_leave_balance` with join to `leave_types` for details
4. Return array of balance records with leave type info

**Response Example**:
```json
[
  {
    "id": "...",
    "employee_id": "...",
    "leave_type_id": "33333333-3333-3333-3333-333333333333",
    "total_leaves": 6,
    "used_leaves": 2,
    "remaining_leaves": 4,
    "year": 2026,
    "leave_type": {
      "id": "33333333-3333-3333-3333-333333333333",
      "name": "Sick Leave",
      "max_per_year": 6
    }
  }
]
```

---

## 5. Leave Types & Special Rules

### Standard Leave Types
1. **Sick Leave** (6 days/year)
   - For medical/health reasons
   - Available to all employees

2. **Casual Leave** (19 days/year)
   - General purpose leave
   - Available to all employees

3. **My Leave** (12 days/year)
   - **Exclusive to female employees**
   - Gender check: `if (profile.gender !== 'female') throw error`
   - Limited to **1 per calendar month** (checked: `start_date` between month-01 and month-end)

### Gender-Based Eligibility
```javascript
// frontend/ApplyLeaveModal.tsx
function getAvailableLeaveTypes(gender) {
  const baseTypes = [SickLeave, CasualLeave];
  if (gender === 'female') {
    return [...baseTypes, MyLeave];
  }
  return baseTypes;
}
```

---

## 6. Holiday Management

### Purpose
Exclude non-working days from leave balance considerations (e.g., Saturdays, Sundays, national holidays).

### Three Types of Holidays

#### 1. **Recurring Weekly Holidays**
- Table: `employee_recurring_holidays`
- Examples: Saturday (6), Sunday (0)
- Configured per employee
- Used to exclude weekends from leave calculations

#### 2. **Specific Date Holidays**
- Table: `employee_specific_holidays`
- Per-employee one-off holidays
- Examples: Company closure on specific date

#### 3. **Master Public Holidays**
- Table: `master_public_holidays` (referenced, actual table name may vary)
- System-wide holidays
- Examples: Diwali, Holi, Independence Day, April 14 (Dr. B.R. Ambedkar Jayanti)

### How Holidays Affect Leave Calculations
Currently **NOT FULLY INTEGRATED** into the `applyForLeave()` calculation.
Leave day calculation uses simple calendar math:
```javascript
leaveDays = Math.ceil((endDate - startDate) / (24*60*60*1000)) + 1;
```

**The conversation history indicates** this was a known issue:
- Nainesh's April 10-14 leave showed 5 days instead of 2
- Should exclude: Sat (12), Sun (13), Holiday (14) = 2 working days only
- Root cause: Holiday tables not being queried during calculation

---

## 7. Frontend Components

### Main Leave Components

#### **ApplyLeaveModal.tsx**
Modal form for employees to request leave.

**Key Features**:
- Date range picker (start_date, end_date)
- Leave type dropdown (filtered by gender)
- Reason textarea
- File upload (Cloudinary integration for medical certificates)
- Real-time balance display showing remaining days

**Key Functions**:
```javascript
handleFileSelect() // Validates image format, max 5MB
uploadToCloudinary() // Uploads to Cloudinary, returns URL
handleSubmit() // Validates and sends to POST /api/leave/apply
```

**Form Validations**:
- Required fields: startDate, endDate, leaveTypeId, description
- Date format: YYYY-MM-DD
- Valid calendar dates (catches invalid like April 31)
- End date ≥ start date

---

#### **LeaveDashboard.tsx**
Employee view showing leave balance and request history.

**Displays**:
- Leave balance cards per leave type (total, used, remaining)
- Leave request history table with status column
- Option to apply for new leave

---

#### **AdminLeaveDashboard.tsx**
Admin dashboard for managing all leave requests.

**Features**:
- Filter by status (pending, approved, rejected)
- Approve/reject requests with comments
- View employee details
- Analytics: total requests, pending, on leave today, this month

---

#### **LeaveBalanceCards.tsx**
Reusable card component showing leave balance breakdown.

**Display Format**:
```
Leave Type Name
Total: X days | Used: Y days | Remaining: Z days
[Progress bar showing used vs remaining]
```

---

### Related Hooks

#### **useLeaveBalance()**
React Query hook for fetching employee's leave balance.
```javascript
const { data: balances, isLoading, error } = useLeaveBalance();
```

---

## 8. API Routes

### Main API Handler: `/api/leave.ts`

Unified endpoint handling multiple sub-routes:

#### **GET /api/leave/my-requests**
Fetch logged-in employee's leave requests.
- Headers: `x-user-id`
- Returns: Array of leave_request records

#### **GET /api/leave/balance**
Fetch employee's leave balance.
- Headers: `x-user-id`, `x-user-role` (optional for admin)
- Query Params: `employeeId` (admin only), `year`
- Returns: Array of employee_leave_balance records with leave_type details

#### **GET /api/leave/policies**
Get available leave types and policies.
- No auth required
- Returns: `{ policies: [], types: [...] }`

#### **POST /api/leave/apply**
Submit new leave request.
- Headers: `x-user-id`
- Body: `{ leaveTypeId, startDate, endDate, reason, attachmentUrl, attachmentType }`
- Returns: Created leave_request record
- Status: 201 Created or 400/500 error

---

## 9. Backend Services

### LeaveService (`server/services/leave.service.ts`)
Central business logic class with static methods:

**Key Methods**:
```typescript
static getLeaveTypes(): Promise<LeaveType[]>
static getEmployeeLeaveBalance(employeeId, year): Promise<EmployeeLeaveBalance[]>
static initializeLeaveBalance(employeeId, year): Promise<EmployeeLeaveBalance[]>
static applyForLeave(employeeId, leaveTypeId, startDate, endDate, reason): Promise<LeaveRequest>
static approveLeaveRequest(leaveRequestId, adminComment): Promise<void>
static rejectLeaveRequest(leaveRequestId, adminComment): Promise<void>
static getEmployeeLeaveRequests(employeeId): Promise<LeaveRequest[]>
static getEmployeesOnLeaveToday(): Promise<any[]>
static getAllLeaveRequests(filters): Promise<any[]>
static getLeaveAnalytics(): Promise<LeaveAnalytics>
static recalculateLeaveBalance(employeeId): Promise<...>
```

---

### LeaveAnniversaryService (`server/services/leave-anniversary.service.ts`)
Handles automatic leave reset on employment anniversary.

**Key Concept**: Employment year ≠ Calendar year
- Employee enrolled April 15, 2024
- Employment year: April 15, 2024 - April 14, 2025
- Fresh leave balance generated each anniversary

**Key Methods**:
```typescript
static calculateCurrentEmploymentYear(enrollmentDate): { start, end }
static formatDateForDB(date): string (YYYY-MM-DD)
static checkAndResetLeaveBalance(employeeId): Promise<boolean>
static getCurrentEmploymentYear(employeeId): Promise<...>
```

---

## 10. Row Level Security (RLS)

All leave tables have RLS enabled for data isolation:

### leave_requests RLS Policies
- **SELECT**: Employees see own requests OR admin sees all
- **INSERT**: Employees can only insert for themselves
- **UPDATE**: Employees can update own pending requests; admins can update any

### employee_leave_balance RLS Policies
- **SELECT**: Employees see own balance OR admin sees all
- **UPDATE**: Only admins can update balances

### leave_types RLS Policies
- **SELECT**: Public read (all authenticated users)

---

## 11. Data Validation & Error Handling

### Application Stage Validations
1. **Date Format**: `YYYY-MM-DD` regex check
2. **Valid Calendar Dates**: Catch April 31, Feb 30, etc.
3. **Date Logic**: End ≥ Start, dates in future
4. **Leave Type**: Must be valid UUID matching database
5. **Balance Check**: Remaining ≥ requested days
6. **My Leave Rules**: 
   - Female employees only
   - Max 1 per calendar month
7. **Overlap Check**: No existing approved leaves during range

### Approval Stage Validations
1. **Request Exists**: Fetch and verify leave_request record
2. **Employment Year**: Validate balance exists in current employment year
3. **My Leave Gender Check**: Revalidate female employee status

### Error Responses
```json
{
  "error": "Insufficient leave balance. Available: 2 days"
}
```

---

## 12. Data Flow Diagram

```
┌─────────────────┐
│   Employee      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  ApplyLeaveModal.tsx        │ ← Form with date picker, reason
│  - Date validation          │
│  - Balance display          │
└────────┬────────────────────┘
         │
         ▼ POST /api/leave/apply
┌─────────────────────────────┐
│  api/leave/apply.ts         │ ← Validation
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ LeaveService.applyForLeave()│ ← Business logic
│ - Overlap check             │ ← My Leave validation
│ - Balance validation        │ ← Employment year check
│ - Insert leave_requests     │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│   Supabase Database          │
│ ├─ leave_requests (INSERT)   │
│ │  status: "pending"         │
│ └─ RLS: own employee_id only │
└──────────────────────────────┘
         │
         ▼ (Admin Approval)
┌──────────────────────────────┐
│ LeaveService.approveLeaveRequest()
│ - Calculate leave days       │
│ - Update leave_requests      │
│ - Update balance (used↑)     │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  employee_leave_balance      │
│  UPDATE: used_leaves,        │
│          remaining_leaves    │
└──────────────────────────────┘
```

---

## 13. Current Issues & Known Gaps

### Issue 1: Holiday Exclusion Not Implemented
- Leave calculation doesn't query holiday tables
- Expected: April 10-14 with Sat 12, Sun 13, Holiday 14 = 2 working days
- Actual: Shows 5 calendar days
- Fix needed: Integrate `employee_recurring_holidays`, `employee_specific_holidays`, `master_public_holidays` into calculation

### Issue 2: Employment Year Fields May Be Missing
- Code references `employment_year_start` and `employment_year_end`
- These may not exist in older database schemas
- Migration may need to add these columns

### Issue 3: Incomplete Holiday Configuration
- Not all employees may have recurring holidays configured
- Master public holidays for 2026 may be incomplete

---

## 14. Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Leave Application | ✅ Working | Employees submit requests with dates/reason |
| Leave Approval | ✅ Working | Admins approve/reject with comments |
| Balance Tracking | ✅ Working | Tracks used/remaining per leave type |
| My Leave (Female Only) | ✅ Working | Gender validation, 1/month limit |
| File Attachments | ✅ Working | Cloudinary integration for certs |
| Anniversary Reset | ✅ Working | Auto resets balance on employment year |
| Holiday Exclusion | ❌ Not Working | Holiday queries not in calculation |
| Overlap Prevention | ✅ Working | Cannot have 2 approved leaves same dates |
| Admin Dashboard | ✅ Working | View/approve all requests |

---

## 15. Deployment Notes

### Environment Variables Required
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_CLOUDINARY_CLOUD_NAME
```

### Frontend Port
- Default: `localhost:8081` (Vite dev server)

### Backend Port
- Vercel serverless (no port, deployed to Vercel)
- Local testing: `vercel dev` uses proxied routes

### Database
- Supabase project (PostgreSQL)
- RLS enabled on all tables
- Service role key required for backend operations

---

## 16. Future Enhancements

1. **Holiday Integration**: Exclude weekends and public holidays from day count
2. **Carryover Logic**: Allow carrying unused days to next year with limits
3. **Notifications**: Email/SMS on application, approval, rejection
4. **Reports**: Generate leave analytics, utilization reports
5. **Mobile App**: React Native companion for employee self-service
6. **Audit Trail**: Detailed logs of all balance changes
7. **Half-Day Leaves**: Support for 0.5-day allocations
8. **Batch Holidays**: HR setup recurring company closures

---

**Last Updated**: April 9, 2026  
**System Date**: 2026  
**Version**: Current (Post-Anniversary Reset)
