# Nexon Attendance - Backend Server

## Overview

This folder contains all backend-related code for the Nexon Attendance system. The backend is built on Supabase (PostgreSQL + Auth) and provides authentication, profile management, user status awareness, employee registration, admin approval workflows, and attendance marking.

**Phase 1 Status**: ✅ Foundation Complete  
**Phase 2 Status**: ✅ Registration & Approval Complete  
**Phase 3 Status**: ✅ Attendance Marking Complete

---

## 📁 Folder Structure

```
server/
├── supabase/
│   └── client.ts              # Supabase client configuration
├── services/
│   ├── auth.service.ts        # Authentication operations (with login restrictions)
│   ├── profile.service.ts     # Profile management
│   ├── registration.service.ts # Employee registration
│   ├── office.service.ts      # Office management
│   ├── admin-approval.service.ts # Admin approval workflows
│   └── attendance.service.ts  # Attendance marking and validation
├── types/
│   ├── database.ts            # Database type definitions
│   ├── profile.ts             # User profile types
│   ├── auth.ts                # Authentication types
│   ├── registration.ts        # Registration types
│   ├── office.ts              # Office types
│   ├── employee-request.ts    # Employee request types
│   └── attendance.ts          # Attendance types
├── config/
│   └── attendance.config.ts   # Attendance time window and rules
├── utils/
│   ├── session.ts             # Session utilities
│   └── status.ts              # Status & role utilities
├── database/
│   └── phase2-schema.sql      # Phase 2 database schema
├── index.ts                   # Central exports
└── README.md                  # This file
```

---

## 🎯 What Phase 3 Does

### 1. Attendance Marking Service
- **File**: `services/attendance.service.ts`
- Mark attendance with strict validation rules
- Validates in order:
  1. User authenticated
  2. User role = employee
  3. User status = active
  4. User has office_id
  5. Within time window (09:30-11:30 IST)
  6. No duplicate attendance for today
- Server-side timestamp (no trust of frontend)
- One attendance per day enforcement

### 2. Attendance Configuration
- **File**: `config/attendance.config.ts`
- Fixed time window: 09:30-11:30 IST
- IST timezone handling
- Helper functions for time validation
- Status rules (present/late/absent)

### 3. Attendance Types
- **File**: `types/attendance.ts`
- Complete TypeScript interfaces for:
  - Attendance record
  - AttendanceResult (success/error)
  - AttendanceErrorCode
  - TodayAttendanceResponse

### 4. Database Table
- **Table**: `attendance`
- Columns:
  - id (UUID)
  - user_id (references auth.users)
  - date (DATE, YYYY-MM-DD)
  - check_in_time (TIMESTAMPTZ)
  - check_out_time (TIMESTAMPTZ, nullable)
  - status (present/late/absent)
  - office_id (references offices)
  - created_at, updated_at
- Unique constraint: (user_id, date)

### 5. RLS Policies
- Employees can:
  - Read their own attendance
  - Insert their own attendance (if active)
- Admins can:
  - Read all attendance
  - Manage all attendance

### 6. Attendance History
- Get today's attendance
- Get attendance history (last 30 days default)
- Sorted by date descending

---

## 🎯 What Phase 2 Does

### 1. Employee Registration Service
- **File**: `services/registration.service.ts`
- Register new employees with email/password
- Creates auth user, profile (status=pending), and employee_request
- User is immediately signed out (cannot login until approved)
- Email uniqueness validation

### 2. Login Restriction Enforcement
- **File**: `services/auth.service.ts` (updated)
- Login flow now checks user status:
  - `pending` → Login blocked with clear error
  - `rejected` → Login blocked with clear error
  - `blocked` → Login blocked with clear error
  - `active` → Login allowed
- Returns backend error states (no UI logic)

### 3. Admin Approval Service
- **File**: `services/admin-approval.service.ts`
- Admin-only operations:
  - Fetch pending employee requests
  - Approve request (sets status=active, records reviewer)
  - Reject request (sets status=rejected, stores reason)
- Enforces admin role verification
- Updates both profile and employee_request tables

### 4. Multi-Office Awareness
- **File**: `services/office.service.ts`
- Fetch active offices for registration
- Get office details by ID
- Admin can view all offices
- Registration accepts office_id
- Admin can change office during approval

### 5. RLS Policies
- **File**: `database/phase2-schema.sql`
- Employees can:
  - Read their own request status
  - Read active offices
- Admins can:
  - View all employee_requests
  - Update request status
  - Manage offices
- Employees cannot see other users' data

### 6. Type Definitions
- **Files**: `types/*.ts`
- Complete TypeScript interfaces for:
  - Office
  - EmployeeRequest
  - RegistrationData
  - ApprovalResponse

---

## 🔧 Environment Variables

Required in `.env` file at project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📊 Database Schema

### Phase 1 Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
  office_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2 Tables

#### offices
```sql
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  wifi_ssids TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### employee_requests
```sql
CREATE TABLE employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  office_id UUID NOT NULL REFERENCES offices(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Phase 3 Tables

#### attendance
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  office_id UUID NOT NULL REFERENCES offices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**Complete Schema**: See `COMPLETE_DATABASE_SETUP.sql`

---

## 🔄 Phase 3: Attendance Marking Flow

### Attendance Marking Flow

```
1. Employee clicks "Mark Attendance"
   ├─ Frontend calls attendanceService.markAttendance(userProfile)
   │
2. Backend validates (strict order):
   ├─ ✅ User authenticated?
   ├─ ✅ User role = employee?
   ├─ ✅ User status = active?
   ├─ ✅ User has office_id?
   ├─ ✅ Current time within 09:30-11:30 IST?
   └─ ✅ Attendance not already marked today?
   │
3. If all pass:
   ├─ Get server timestamp (IST)
   ├─ Get today's date (YYYY-MM-DD, IST)
   ├─ Insert attendance record
   │   ├─ user_id
   │   ├─ date (today)
   │   ├─ check_in_time (server timestamp)
   │   ├─ status = 'present'
   │   └─ office_id
   └─ Return success with attendance record
   │
4. If any validation fails:
   └─ Return error with specific error code
```

### Validation Error Codes

```typescript
type AttendanceErrorCode =
  | 'UNAUTHORIZED'              // User not authenticated
  | 'NOT_EMPLOYEE'              // User is admin, not employee
  | 'ACCOUNT_NOT_ACTIVE'        // User status is pending/rejected/blocked
  | 'NO_OFFICE_ASSIGNED'        // User has no office_id
  | 'OUTSIDE_TIME_WINDOW'       // Current time not in 09:30-11:30 IST
  | 'ATTENDANCE_ALREADY_MARKED' // Attendance already exists for today
  | 'VALIDATION_FAILED';        // Database or other error
```

### Time Window Rules

- **Window**: 09:30 AM - 11:30 AM IST (fixed)
- **Timezone**: Asia/Kolkata (IST)
- **Server-side**: All time calculations done on server
- **No trust**: Frontend cannot manipulate time/date
- **Status**: Currently all check-ins = 'present' (late logic can be added later)

---

## 🔄 Phase 2: Registration & Approval Flow

### Employee Registration Flow

```
1. User submits registration form
   ├─ Email, password, full_name, office_id
   │
2. registrationService.registerEmployee()
   ├─ Create auth user (Supabase Auth)
   ├─ Create profile (status = 'pending')
   ├─ Create employee_request (status = 'pending')
   └─ Sign out user immediately
   │
3. User receives confirmation
   └─ "Registration successful. Awaiting admin approval."
```

### Login Restriction Flow

```
1. User attempts login
   ├─ authService.login(email, password)
   │
2. Authenticate with Supabase
   ├─ Success → Fetch profile
   │
3. Check profile status
   ├─ pending → Sign out, return error
   ├─ rejected → Sign out, return error
   ├─ blocked → Sign out, return error
   └─ active → Allow login
```

### Admin Approval Flow

```
1. Admin views pending requests
   ├─ adminApprovalService.getPendingRequests()
   │
2. Admin reviews request
   │
3a. APPROVE
   ├─ adminApprovalService.approveRequest()
   ├─ Update profile.status = 'active'
   ├─ Update employee_request.status = 'approved'
   ├─ Record reviewed_by, reviewed_at
   └─ User can now login
   │
3b. REJECT
   ├─ adminApprovalService.rejectRequest()
   ├─ Update profile.status = 'rejected'
   ├─ Update employee_request.status = 'rejected'
   ├─ Store rejection_reason
   └─ User permanently blocked
```

---

## 🚀 Usage Examples

### Phase 3: Attendance Marking

```typescript
import { attendanceService, isWithinAttendanceWindow, getTodayDateIST } from '@server';

// Check if within time window
if (isWithinAttendanceWindow()) {
  console.log('Attendance window is open');
} else {
  console.log('Attendance window is closed');
}

// Mark attendance
const result = await attendanceService.markAttendance(userProfile);

if (result.success) {
  console.log('Attendance marked:', result.attendance);
  console.log('Check-in time:', result.attendance.check_in_time);
  console.log('Status:', result.attendance.status);
} else {
  console.error('Error:', result.error);
  console.error('Error code:', result.errorCode);
  
  // Handle specific errors
  switch (result.errorCode) {
    case 'NOT_EMPLOYEE':
      console.log('Admins cannot mark attendance');
      break;
    case 'OUTSIDE_TIME_WINDOW':
      console.log('Attendance window is 09:30-11:30 IST');
      break;
    case 'ATTENDANCE_ALREADY_MARKED':
      console.log('Already marked for today');
      break;
  }
}

// Get today's attendance
const { attendance, error } = await attendanceService.getTodayAttendance(userProfile);

if (attendance) {
  console.log('Already marked today:', attendance.check_in_time);
} else {
  console.log('Not marked yet');
}

// Get attendance history
const { attendance: history } = await attendanceService.getAttendanceHistory(
  userProfile,
  30 // last 30 days
);

console.log(`Found ${history.length} attendance records`);
history.forEach(record => {
  console.log(`${record.date}: ${record.status} at ${record.check_in_time}`);
});
```

### Phase 2: Employee Registration

```typescript
import { registrationService, officeService } from '@server';

// Get available offices
const { offices } = await officeService.getActiveOffices();

// Register new employee
const { success, error, message } = await registrationService.registerEmployee({
  email: 'employee@nexon.com',
  password: 'SecurePass123!',
  full_name: 'John Doe',
  office_id: offices[0].id,
});

if (success) {
  console.log(message); // "Registration successful. Awaiting admin approval."
} else {
  console.error(error);
}
```

### Phase 2: Login with Status Check

```typescript
import { authService } from '@server';

const { user, session, error } = await authService.login(
  'employee@nexon.com',
  'password123'
);

if (error) {
  // Check error type
  if (error.status === 'pending') {
    console.log('Account pending approval');
  } else if (error.status === 'rejected') {
    console.log('Account rejected');
  } else {
    console.log('Login failed:', error.message);
  }
} else {
  console.log('Login successful:', user?.email);
}
```

### Phase 2: Admin Approval

```typescript
import { adminApprovalService } from '@server';

// Fetch pending requests (admin only)
const { requests, error } = await adminApprovalService.getPendingRequests(adminProfile);

// Approve a request
const { success } = await adminApprovalService.approveRequest(
  requestId,
  adminProfile,
  optionalNewOfficeId // Can change office during approval
);

// Reject a request
const { success } = await adminApprovalService.rejectRequest(
  requestId,
  adminProfile,
  'Incomplete information provided'
);
```

### Phase 1: Profile Management

```typescript
import { profileService } from '@server';

// Fetch user profile
const { profile, error } = await profileService.getProfile(userId);

if (profile) {
  console.log('Role:', profile.role);
  console.log('Status:', profile.status);
  console.log('Office:', profile.office_location);
}
```

### Phase 1: Status Checking

```typescript
import { canAccessApp, isPending, isAdmin } from '@server';

if (canAccessApp(profile)) {
  // User has full access
}

if (isPending(profile)) {
  // User is awaiting approval
}

if (isAdmin(profile)) {
  // User is an administrator
}
```

---

## 🚫 What Phase 3 Does NOT Include

As per requirements, Phase 3 focuses on basic attendance marking only:

- ❌ GPS/Geofencing validation
- ❌ WiFi network validation
- ❌ Check-out functionality
- ❌ Late status calculation
- ❌ Grace period handling
- ❌ Notifications
- ❌ Reports/Analytics
- ❌ Admin attendance management UI

These will be added in future phases.

---

## 🚫 What Phase 2 Does NOT Include

As per requirements, Phase 2 focuses on registration and approval only:

- ❌ Attendance marking logic
- ❌ Report generation
- ❌ Notifications
- ❌ Cron jobs
- ❌ Geofencing validation
- ❌ WiFi validation
- ❌ Attendance history

These were added in Phase 3 and future phases.

---

## 🔐 Security

- ✅ Environment variables for credentials
- ✅ No hardcoded secrets
- ✅ Type-safe operations
- ✅ Row Level Security (RLS) on database
- ✅ Supabase Auth for authentication

---

## 📦 Exports

All backend functionality is exported from `server/index.ts`:

```typescript
// Services
export { authService, profileService, registrationService, officeService, adminApprovalService, attendanceService }

// Types
export type { UserProfile, UserRole, UserStatus }
export type { AuthResponse, SessionResponse }
export type { RegistrationData, RegistrationResponse }
export type { Office, EmployeeRequest, RequestStatus }
export type { ApprovalResponse }
export type { Attendance, AttendanceStatus, AttendanceResult, AttendanceErrorCode }

// Configuration
export { ATTENDANCE_CONFIG, getCurrentISTTime, getTodayDateIST, isWithinAttendanceWindow }

// Utilities
export { canAccessApp, isPending, isAdmin, isEmployee }
export { isSessionValid, isAuthenticated }
```

---

## 🔜 What Phase 4 Will Add

Phase 4 will implement:

1. **Advanced Validation**
   - GPS/Geofencing validation
   - WiFi network detection
   - Grace period handling

2. **Check-out Functionality**
   - Check-out time recording
   - Work hours calculation

3. **Late Status**
   - Late arrival detection
   - Configurable late threshold

4. **Reports & Analytics**
   - Attendance reports
   - Employee attendance history
   - Export functionality

5. **Notifications**
   - Email notifications
   - Push notifications

---

## ✅ Phase 3 Validation

Before moving to Phase 4, verify:

- [x] Attendance service implemented
- [x] Attendance types defined
- [x] Attendance configuration created
- [x] Time window validation (09:30-11:30 IST)
- [x] Strict validation order enforced
- [x] One attendance per day enforced
- [x] Admin restriction (cannot mark attendance)
- [x] Status enforcement (only active employees)
- [x] Server-side timestamp (no frontend trust)
- [x] Database table created with RLS
- [x] Attendance history functionality
- [x] Types exported from server/index.ts
- [x] Documentation complete

---

## ✅ Phase 2 Validation

Before moving to Phase 3, verify:

- [x] Registration service implemented
- [x] Login restrictions enforced
- [x] Admin approval service implemented
- [x] Multi-office awareness
- [x] RLS policies configured
- [x] Types defined
- [x] Documentation complete

---

## ✅ Phase 1 Validation

Before moving to Phase 2, verify:

- [x] Backend code exists in `server/` folder
- [x] Frontend and backend are separated
- [x] Supabase client configured
- [x] Auth service implemented
- [x] Profile service implemented
- [x] Status utilities ready
- [x] Types defined
- [x] No business logic implemented yet
- [x] Documentation complete

---

## 🎯 Architecture Principles

1. **Separation of Concerns**: Backend code isolated in `server/`
2. **Type Safety**: Full TypeScript support
3. **Modularity**: Services and utilities are independent
4. **Reusability**: Functions designed for future phases
5. **Security**: No secrets in code, environment-based config
6. **Scalability**: Clean structure for adding features

---

**Phase 1 Status**: ✅ Complete  
**Last Updated**: February 10, 2026  
**Next Phase**: Phase 2 - Attendance & Admin Features
