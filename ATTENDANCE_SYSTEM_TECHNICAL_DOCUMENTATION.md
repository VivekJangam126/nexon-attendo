# NEXUS ATTENDO - ATTENDANCE SYSTEM TECHNICAL DOCUMENTATION

**Version:** 1.0.0  
**Last Updated:** February 17, 2026  
**System Status:** Production-Ready

---

## 1. EXECUTIVE OVERVIEW

### 1.1 What the System Does

Nexus Attendo is a location-based employee attendance management system that enables:

- **Employee Attendance Marking**: Employees mark attendance using GPS and Wi-Fi verification
- **Admin Management**: Administrators manage employees, offices, attendance windows, and notifications
- **Automated Notifications**: Scheduled SMS and email alerts to HR contacts about attendance statistics
- **Reporting & Analytics**: Comprehensive attendance reports with export capabilities (CSV/PDF)
- **Registration Workflow**: Employee registration with admin approval process

### 1.2 User Roles

The system supports two distinct user roles:

**1. Employee**
- Register for account access
- Mark daily attendance (check-in only, no check-out)
- View personal attendance history
- View attendance rules and office information
- Update profile information

**2. Admin**
- Approve/reject employee registrations
- Manage office locations and Wi-Fi networks
- Configure attendance windows and grace periods
- Manage HR notification contacts and schedules
- View system-wide attendance reports and analytics
- Manually trigger attendance notifications
- Manage employee accounts (block/unblock)

### 1.3 Problems Solved

1. **Manual Attendance Tracking**: Eliminates paper-based or manual attendance systems
2. **Location Verification**: Ensures employees are physically present at office using GPS + Wi-Fi
3. **Real-time Monitoring**: Provides instant visibility into daily attendance status
4. **Automated Reporting**: Generates and distributes attendance reports automatically
5. **Compliance**: Maintains accurate attendance records with timestamps and location data
6. **Centralized Management**: Single platform for all attendance-related operations

### 1.4 Current Development Stage

**Status**: Production-Ready

**Implemented Features**:
- Complete authentication and authorization system
- Employee registration with admin approval workflow
- GPS and Wi-Fi based attendance marking
- Database-driven attendance window configuration
- Grace period for late marking
- Strict mode toggle (enable/disable location verification)
- Automated notification system with scheduling
- Manual notification triggers
- Comprehensive reporting with CSV/PDF export
- Admin dashboard with real-time statistics
- Employee management interface
- Office and network management

---

## 2. COMPLETE ARCHITECTURE EXPLANATION

### 2.1 Technology Stack

#### Frontend Stack
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Language**: TypeScript 5.8.3
- **Routing**: React Router DOM 6.30.1
- **State Management**: React Query (TanStack Query) 5.83.0
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17
- **Form Handling**: React Hook Form 7.61.1 with Zod validation
- **Icons**: Lucide React 0.462.0
- **PDF Generation**: jsPDF 4.1.0 with jspdf-autotable 5.0.7
- **Charts**: Recharts 2.15.4

#### Backend Stack
- **Runtime**: Node.js (via Vite dev server and Vercel serverless)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **API Client**: Supabase JS SDK 2.95.3
- **Email Service**: Resend 6.9.2
- **SMS Service**: Twilio 5.12.1
- **Environment**: Dotenv 17.2.4

#### Development Tools
- **Package Manager**: npm
- **Linter**: ESLint 9.32.0
- **Testing**: Vitest 3.2.4 with Testing Library
- **TypeScript Compiler**: TSC with strict mode disabled for rapid development

### 2.2 Database Architecture

**Database Provider**: Supabase (PostgreSQL)

**Connection Details**:
- URL: `https://falbkccaqjqdbvrmdlll.supabase.co`
- Authentication: Anon key for client-side, Service role key for admin operations
- Region: Auto-selected by Supabase

**Tables** (9 total):
1. `profiles` - User profiles with role and status
2. `offices` - Office locations with GPS coordinates
3. `office_networks` - Wi-Fi network configurations per office
4. `employee_requests` - Registration approval queue
5. `attendance` - Daily attendance records
6. `attendance_settings` - Configurable attendance windows
7. `notification_settings` - Notification time slots
8. `notification_contacts` - HR contact list
9. `notification_history` - Notification delivery logs

**Row Level Security (RLS)**: Enabled on all tables with specific policies for read/write access

### 2.3 Third-Party Integrations

#### Resend (Email Service)
- **Purpose**: Send attendance report emails to HR contacts
- **API Key**: Configured via `RESEND_API_KEY` environment variable
- **From Address**: `onboarding@resend.dev` (trial account)
- **Features Used**: HTML email sending with retry logic
- **Limitations**: Trial account restrictions apply

#### Twilio (SMS Service)
- **Purpose**: Send attendance report SMS to HR contacts
- **Configuration**:
  - Account SID: `TWILIO_ACCOUNT_SID`
  - Auth Token: `TWILIO_AUTH_TOKEN`
  - Phone Number: `TWILIO_PHONE_NUMBER`
- **Features Used**: SMS sending with retry logic
- **Limitations**: Trial account restrictions apply

### 2.4 Frontend-Backend Communication

**Architecture Pattern**: Service-Oriented Architecture

**Communication Flow**:
```
Frontend Component
    ↓
Service Layer (server/services/*.service.ts)
    ↓
Supabase Client (server/supabase/client.ts)
    ↓
PostgreSQL Database
```

**Service Layer Structure**:
- All backend logic is encapsulated in service files
- Services are imported via `@server` alias
- Frontend components never directly access Supabase
- Type-safe interfaces defined in `server/types/`

**API Endpoints**:
- **Development**: Vite middleware handles `/api/send-notification`
- **Production**: Vercel serverless function at `/api/send-notification`
- All other operations use Supabase client directly

### 2.5 Role Separation

**Employee Role**:
- Routes: `/dashboard`, `/history`, `/profile`, `/attendance-*`
- Permissions: Mark own attendance, view own history, update own profile
- Restrictions: Cannot access admin routes, cannot mark attendance for others

**Admin Role**:
- Routes: `/admin/*` (dashboard, employees, reports, settings)
- Permissions: Full system access, manage all users, configure settings
- Restrictions: Cannot mark attendance (admins are not employees)

**Route Protection**:
- Implemented via `useAuth` hook
- Checks authentication status and user role
- Redirects unauthorized users to appropriate screens

### 2.6 Server Folder Structure

```
server/
├── api/
│   └── send-notification.ts          # Vercel serverless function
├── services/
│   ├── admin-approval.service.ts     # Employee approval logic
│   ├── attendance.service.ts         # Attendance marking & validation
│   ├── attendance-settings.service.ts # Window configuration
│   ├── auth.service.ts               # Authentication operations
│   ├── dashboard.service.ts          # Admin dashboard stats
│   ├── employee.service.ts           # Employee management
│   ├── notification.service.ts       # Email/SMS sending
│   ├── notification-settings.service.ts # Notification config
│   ├── notification-trigger.service.ts  # Manual notifications
│   ├── office.service.ts             # Office management
│   ├── office-network.service.ts     # Wi-Fi verification
│   ├── profile.service.ts            # User profile operations
│   ├── registration.service.ts       # Employee registration
│   └── reports.service.ts            # Attendance reports
├── supabase/
│   ├── api-client.ts                 # Service role client
│   └── client.ts                     # Anon key client
├── types/
│   ├── attendance.ts                 # Attendance types
│   ├── attendance-settings.ts        # Settings types
│   ├── auth.ts                       # Auth types
│   ├── database.ts                   # Database schema types
│   ├── employee-request.ts           # Request types
│   ├── office.ts                     # Office types
│   ├── profile.ts                    # Profile types
│   └── registration.ts               # Registration types
├── utils/
│   ├── session.ts                    # Session helpers
│   └── status.ts                     # Status check helpers
└── index.ts                          # Central export point
```

### 2.7 Environment Configuration

**Environment Files**:
- `.env` - Local development (gitignored)
- `.env.example` - Template with example values
- `.env.production` - Production values (gitignored)
- `.env.production.example` - Production template

**Required Variables**:
```bash
# Supabase
VITE_SUPABASE_URL=https://falbkccaqjqdbvrmdlll.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Email (Resend)
RESEND_API_KEY=<resend_api_key>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<twilio_sid>
TWILIO_AUTH_TOKEN=<twilio_token>
TWILIO_PHONE_NUMBER=<twilio_number>
```

**Variable Usage**:
- `VITE_*` prefix: Exposed to frontend (public)
- No prefix: Backend-only (serverless functions)
- Loaded via Vite's `loadEnv` in development
- Loaded via Vercel environment variables in production

---

## 3. AUTHENTICATION & AUTHORIZATION SYSTEM

### 3.1 Authentication Flow

**Login Process**:
```
1. User enters email + password
   ↓
2. Frontend calls authService.login()
   ↓
3. Supabase Auth validates credentials
   ↓
4. If valid, fetch user profile from profiles table
   ↓
5. Check profile status (pending/active/rejected/blocked)
   ↓
6. If status = 'active', allow login
   ↓
7. If status ≠ 'active', sign out and show error
   ↓
8. Store session in Supabase Auth (httpOnly cookie)
   ↓
9. Redirect to appropriate dashboard (employee/admin)
```

**Status-Based Login Restrictions**:
- `pending`: Login blocked → "Account pending approval"
- `rejected`: Login blocked → "Account has been rejected"
- `blocked`: Login blocked → "Account has been blocked"
- `active`: Login allowed → Proceed to dashboard

### 3.2 Registration Flow

**Employee Registration Process**:
```
1. User visits /register
   ↓
2. Fills form: name, email, password, office selection
   ↓
3. Frontend calls registrationService.register()
   ↓
4. Backend creates auth user in Supabase Auth
   ↓
5. Backend creates profile with status='pending', role='employee'
   ↓
6. Backend creates employee_request with status='pending'
   ↓
7. Auto-assign office_id to profile (single office mode)
   ↓
8. User redirected to /registration-pending
   ↓
9. User cannot login until admin approves
```

**Single Office Mode**:
- System currently operates in single office mode
- Only one office is marked as `is_active=true`
- All new employees are auto-assigned to the active office
- Office selection in registration form is for future multi-office support

### 3.3 Admin Approval Flow

**Approval Process**:
```
1. Admin views /admin/pending-approvals
   ↓
2. Sees list of pending employee_requests
   ↓
3. Admin clicks Approve or Reject
   ↓
4. If Approve:
   - Update employee_request.status = 'approved'
   - Update profiles.status = 'active'
   - Employee can now login
   ↓
5. If Reject:
   - Update employee_request.status = 'rejected'
   - Update profiles.status = 'rejected'
   - Optionally add rejection_reason
   - Employee cannot login
```

**Rejection Handling**:
- Rejected users see error message on login attempt
- Rejection reason is stored but not currently displayed to user
- Rejected users cannot re-register with same email

### 3.4 Status Restrictions

**Profile Status Values**:
- `pending`: New registration, awaiting admin approval
- `active`: Approved, can login and use system
- `rejected`: Registration denied, cannot login
- `blocked`: Admin-blocked, cannot login

**Status Enforcement Points**:
1. **Login**: Checked in `authService.login()`
2. **Attendance Marking**: Checked in `attendanceService.markAttendance()`
3. **Route Access**: Checked in `useAuth` hook
4. **API Calls**: Implicitly enforced via session validation

### 3.5 Role-Based Routing

**Route Protection Implementation**:
```typescript
// useAuth hook checks:
1. Is user authenticated? (session exists)
2. What is user role? (employee/admin)
3. What is user status? (active/pending/rejected/blocked)

// Route access rules:
- /dashboard → employee role + active status
- /admin/* → admin role + active status
- /login → unauthenticated only
- /register → unauthenticated only
```

**Redirect Logic**:
- Unauthenticated → `/login`
- Employee trying to access admin → `/dashboard`
- Admin trying to access employee → `/admin/dashboard`
- Pending/Rejected/Blocked → Appropriate error screen

### 3.6 Protected Routes

**Employee Routes** (require employee role + active status):
- `/dashboard` - Employee dashboard
- `/history` - Attendance history
- `/profile` - Profile management
- `/attendance-processing` - Attendance marking flow
- `/attendance-success` - Success confirmation
- `/attendance-error` - Error display

**Admin Routes** (require admin role + active status):
- `/admin/dashboard` - Admin dashboard
- `/admin/employees` - Employee management
- `/admin/employee/:id` - Employee details
- `/admin/add-employee` - Add employee manually
- `/admin/pending-approvals` - Approval queue
- `/admin/reports` - Attendance reports (legacy)
- `/admin/history` - History & reports (new)
- `/admin/settings` - System settings
- `/admin/settings/*` - Settings sub-pages

**Public Routes** (no authentication required):
- `/` - Splash screen
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset
- `/help-support` - Help documentation
- `/attendance-rules` - Attendance rules display

### 3.7 Session Management

**Session Storage**:
- Managed by Supabase Auth
- Stored in httpOnly cookie (secure)
- Automatically refreshed by Supabase SDK
- Expires after inactivity period (configurable in Supabase)

**Session Validation**:
```typescript
// On app load:
1. Check if session exists (supabase.auth.getSession())
2. If exists, fetch user profile
3. Validate profile status
4. If valid, set authenticated state
5. If invalid, clear session and redirect to login
```

**Session Lifecycle**:
- **Login**: Session created by Supabase Auth
- **Activity**: Session auto-refreshed on API calls
- **Logout**: Session destroyed via `authService.logout()`
- **Expiry**: Session expires after inactivity (Supabase default: 1 hour)

### 3.8 Supabase Integration

**Client Types**:
1. **Anon Key Client** (`server/supabase/client.ts`):
   - Used for frontend operations
   - Respects Row Level Security (RLS) policies
   - Limited permissions based on authenticated user

2. **Service Role Client** (`server/supabase/api-client.ts`):
   - Used for admin operations
   - Bypasses RLS policies
   - Full database access
   - Used in serverless functions

**Authentication Methods**:
- Email/Password (currently implemented)
- Magic Link (Supabase supports, not implemented)
- OAuth (Supabase supports, not implemented)

### 3.9 Service Role Usage

**When Service Role is Used**:
- Admin approval/rejection of employee requests
- Admin blocking/unblocking users
- Admin viewing all attendance records
- Admin managing offices and networks
- Notification system accessing all data

**Security Considerations**:
- Service role key never exposed to frontend
- Only used in backend services and serverless functions
- Environment variable protection
- No direct database queries from frontend

---

## 4. ATTENDANCE SYSTEM (DEEP TECHNICAL DETAIL)

### 4.1 Attendance Window Logic (Database-Driven)

**Configuration Table**: `attendance_settings`

**Fields**:
- `setting_name`: Unique identifier (e.g., "default_attendance_window")
- `start_time`: Window start time (TIME format, e.g., "09:30:00")
- `end_time`: Window end time (TIME format, e.g., "18:00:00")
- `grace_period_minutes`: Minutes after start_time for on-time marking (default: 15)
- `strict_mode`: Enable/disable GPS+WiFi verification (BOOLEAN)
- `is_active`: Whether this window is currently active (BOOLEAN)

**Current Configuration**:
```sql
setting_name: 'default_attendance_window'
start_time: '09:30:00'  -- 9:30 AM IST
end_time: '18:00:00'    -- 6:00 PM IST
grace_period_minutes: 15
strict_mode: true
is_active: true
```

**Window Calculation**:
```
Attendance Window: 09:30 AM to 6:00 PM IST
Grace Period: 09:30 AM to 09:45 AM IST (15 minutes)

Status Logic:
- Check-in ≤ 09:45 AM → Status: 'present'
- Check-in > 09:45 AM and ≤ 6:00 PM → Status: 'late'
- Check-in > 6:00 PM → Attendance window closed (error)
```

### 4.2 Validation Order (STRICT)

**markAttendance() Validation Sequence**:

```
1. User Authentication
   ↓ Check: userProfile exists and has valid ID
   ↓ Error: "User not authenticated" (UNAUTHORIZED)
   
2. Role Verification
   ↓ Check: userProfile.role === 'employee'
   ↓ Error: "Only employees can mark attendance" (NOT_EMPLOYEE)
   
3. Status Verification
   ↓ Check: userProfile.status === 'active'
   ↓ Error: "Account status is '{status}'" (ACCOUNT_NOT_ACTIVE)
   
4. Office Assignment
   ↓ Check: userProfile.office_location exists
   ↓ Error: "No office assigned" (NO_OFFICE_ASSIGNED)
   
5. Attendance Window Check
   ↓ Fetch: attendance_settings WHERE is_active=true
   ↓ Check: Current IST time within start_time and end_time
   ↓ Error: "Attendance is currently closed" (ATTENDANCE_CLOSED)
   
6. Strict Mode Check
   ↓ Fetch: attendance_settings.strict_mode
   ↓ If strict_mode = false → Skip to step 9
   ↓ If strict_mode = true → Continue to step 7
   
7. GPS Coordinates Validation (Strict Mode Only)
   ↓ Check: latitude and longitude provided
   ↓ Error: "Location permission required" (GPS_REQUIRED)
   
8. GPS Proximity Verification (Strict Mode Only)
   ↓ Fetch: Active office GPS coordinates
   ↓ Calculate: Haversine distance between user and office
   ↓ Check: distance ≤ office.radius_meters
   ↓ Error: "Not inside office premises" (OUTSIDE_OFFICE_LOCATION)
   
9. Wi-Fi Network Verification (Strict Mode Only)
   ↓ Check: ipAddress provided
   ↓ Error: "Connect to office Wi-Fi" (OFFICE_WIFI_REQUIRED)
   ↓ Fetch: office_networks for active office
   ↓ Check: IP address matches any network's ip_range prefix
   ↓ Error: "Connect to office Wi-Fi" (OFFICE_WIFI_REQUIRED)
   
10. Duplicate Check
    ↓ Query: attendance WHERE user_id AND date=today
    ↓ Check: No existing record
    ↓ Error: "Attendance already marked" (ATTENDANCE_ALREADY_MARKED)
    
11. Late Detection
    ↓ Get: Current IST time in minutes (hour * 60 + minute)
    ↓ Calculate: grace_period_end = start_time + grace_period_minutes
    ↓ Compare: check_in_time ≤ grace_period_end
    ↓ Result: 'present' if true, 'late' if false
    
12. Insert Attendance Record
    ↓ Insert: attendance table with all data
    ↓ Store: check_in_time in UTC (converted from IST)
    ↓ Return: Success with attendance record
```

**Validation Bypass (Strict Mode = false)**:
- Steps 7-9 are skipped
- Attendance can be marked without GPS or Wi-Fi verification
- Late detection still applies
- Useful for testing or special circumstances

### 4.3 GPS Verification Logic

**Haversine Formula Implementation**:
```typescript
function calculateDistance(lat1, lon1, lat2, lon2): meters {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * π / 180;
  const φ2 = lat2 * π / 180;
  const Δφ = (lat2 - lat1) * π / 180;
  const Δλ = (lon2 - lon1) * π / 180;
  
  const a = sin(Δφ/2)² + cos(φ1) * cos(φ2) * sin(Δλ/2)²;
  const c = 2 * atan2(√a, √(1-a));
  
  return R * c; // Distance in meters
}
```

**Verification Process**:
1. User's device provides GPS coordinates (latitude, longitude)
2. System fetches active office coordinates from database
3. Haversine formula calculates great-circle distance
4. Distance compared against office.radius_meters (default: 100m)
5. If distance > radius → Attendance rejected

**Accuracy Considerations**:
- GPS accuracy depends on device and environment
- Typical smartphone GPS accuracy: 5-10 meters
- Office radius set to 100 meters to account for GPS drift
- Indoor GPS may be less accurate

### 4.4 Wi-Fi Verification Logic

**Network Configuration**:
- Table: `office_networks`
- Fields: `network_name`, `ip_range`, `office_id`, `is_active`
- IP Range Format: Prefix matching (e.g., "192.168.1")

**Verification Process**:
```
1. User's device connects to office Wi-Fi
   ↓
2. Frontend captures client IP address
   ↓
3. Backend receives IP in markAttendance() call
   ↓
4. Query office_networks for active office
   ↓
5. For each network:
   - Check if user IP starts with network.ip_range
   - If match found → Verification passed
   ↓
6. If no match → Attendance rejected
```

**IP Address Capture**:
- Development: Vite dev server provides IP via request headers
- Production: Vercel serverless function provides IP via request headers
- Fallback: If IP not available, verification fails

**Demo Mode Limitation**:
- Current implementation uses prefix matching
- Not suitable for production with dynamic IPs
- Recommended: Implement SSID verification via native app

### 4.5 Duplicate Attendance Prevention

**Database Constraint**:
```sql
UNIQUE(user_id, date)
```

**Application-Level Check**:
```typescript
// Before inserting attendance:
const { data: existingAttendance } = await supabase
  .from('attendance')
  .select('*')
  .eq('user_id', userProfile.id)
  .eq('date', todayDateIST)
  .maybeSingle();

if (existingAttendance) {
  return { error: 'Attendance already marked for today' };
}
```

**Enforcement**:
- Database constraint prevents duplicate inserts
- Application check provides user-friendly error message
- No update/overwrite allowed once marked

### 4.6 Timezone Handling (IST)

**System Timezone**: Asia/Kolkata (IST, UTC+5:30)

**Timezone Conversion Points**:

1. **Current Time Calculation**:
```typescript
function getCurrentISTTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata' 
    })
  );
}
```

2. **Date Extraction**:
```typescript
function getTodayDateIST(): string {
  const now = getCurrentISTTime();
  return `${now.getFullYear()}-${month}-${day}`; // YYYY-MM-DD
}
```

3. **Database Storage**:
- `check_in_time`: Stored as TIMESTAMPTZ (UTC)
- Conversion: IST → UTC via `toISOString()`
- Display: UTC → IST via `toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })`

4. **Late Detection**:
- All time comparisons done in IST
- Window times stored in database as TIME (no timezone)
- Assumed to be IST times

**Critical Note**: All time-based logic assumes IST timezone. System will not work correctly if deployed in different timezone without modifications.

### 4.7 Office Assignment Logic

**Single Office Mode** (Current Implementation):
- Only one office marked as `is_active=true`
- All employees auto-assigned to active office
- Office selection in registration is cosmetic

**Assignment Points**:
1. **Registration**: Auto-assign active office to new employee
2. **Login Safety Net**: If employee has no office, auto-assign active office
3. **Attendance Marking**: Use employee's assigned office for verification

**Future Multi-Office Support**:
- Database schema supports multiple offices
- Each employee has `office_location` field
- Attendance verification uses employee's assigned office
- Not currently implemented in UI

### 4.8 Error Codes

**Attendance Error Codes**:
- `UNAUTHORIZED`: User not authenticated
- `NOT_EMPLOYEE`: User is admin, not employee
- `ACCOUNT_NOT_ACTIVE`: User status is not 'active'
- `NO_OFFICE_ASSIGNED`: User has no office_location
- `ATTENDANCE_CLOSED`: Current time outside attendance window
- `GPS_REQUIRED`: GPS coordinates not provided (strict mode)
- `OUTSIDE_OFFICE_LOCATION`: User too far from office
- `OFFICE_WIFI_REQUIRED`: IP address not on office network
- `ATTENDANCE_ALREADY_MARKED`: Duplicate attendance attempt
- `VALIDATION_FAILED`: Generic validation or database error

**Error Handling**:
- All errors returned as `{ success: false, error: string, errorCode: string }`
- Frontend displays user-friendly error messages
- Error codes used for conditional UI rendering

### 4.9 Complete markAttendance() Flow

**Step-by-Step Execution**:

```
INPUT: userProfile, latitude, longitude, ipAddress

STEP 1: Validate User Authentication
  - Check userProfile exists and has ID
  - If fail → Return UNAUTHORIZED

STEP 2: Validate User Role
  - Check userProfile.role === 'employee'
  - If fail → Return NOT_EMPLOYEE

STEP 3: Validate User Status
  - Check userProfile.status === 'active'
  - If fail → Return ACCOUNT_NOT_ACTIVE

STEP 4: Validate Office Assignment
  - Check userProfile.office_location exists
  - If fail → Return NO_OFFICE_ASSIGNED

STEP 5: Fetch Attendance Window Settings
  - Query attendance_settings WHERE is_active=true
  - Get start_time, end_time, grace_period_minutes, strict_mode
  - If not found → Return VALIDATION_FAILED

STEP 6: Check Attendance Window
  - Get current IST time
  - Convert to minutes: hour * 60 + minute
  - Check if within start_time and end_time
  - If outside → Return ATTENDANCE_CLOSED

STEP 7: Check Strict Mode
  - If strict_mode = false → Jump to STEP 10
  - If strict_mode = true → Continue to STEP 8

STEP 8: Validate GPS Coordinates (Strict Mode)
  - Check latitude and longitude provided
  - If missing → Return GPS_REQUIRED
  - Fetch active office GPS coordinates
  - Calculate Haversine distance
  - Check distance ≤ office.radius_meters
  - If too far → Return OUTSIDE_OFFICE_LOCATION

STEP 9: Validate Wi-Fi Network (Strict Mode)
  - Check ipAddress provided
  - If missing → Return OFFICE_WIFI_REQUIRED
  - Fetch office_networks for active office
  - Check IP prefix match
  - If no match → Return OFFICE_WIFI_REQUIRED

STEP 10: Check Duplicate Attendance
  - Query attendance WHERE user_id AND date=today
  - If exists → Return ATTENDANCE_ALREADY_MARKED

STEP 11: Calculate Late Status
  - Get current IST time in minutes
  - Calculate grace_period_end = start_time + grace_period_minutes
  - If check_in_time ≤ grace_period_end → status = 'present'
  - Else → status = 'late'

STEP 12: Insert Attendance Record
  - Prepare data:
    - user_id: userProfile.id
    - date: today in YYYY-MM-DD (IST)
    - check_in_time: current IST time (stored as UTC)
    - status: 'present' or 'late'
    - office_id: active office ID
    - latitude, longitude, ip_address: as provided
  - Insert into attendance table
  - If error → Return VALIDATION_FAILED

STEP 13: Return Success
  - Return { success: true, attendance: record }

OUTPUT: AttendanceResult { success, attendance?, error?, errorCode? }
```

**Logging**:
- Extensive console logging at each step
- Logs include: user email, GPS coords, IP, time calculations, status determination
- Useful for debugging and auditing

---

## 5. ADMIN PANEL FEATURES (COMPLETE BREAKDOWN)

### 5.1 Employee Approval Workflow

**Screen**: `/admin/pending-approvals`

**Functionality**:
1. Display list of pending employee_requests
2. Show employee details: name, email, office, registration date
3. Provide Approve/Reject actions

**Approval Process**:
```
Admin clicks "Approve"
  ↓
Frontend calls adminApprovalService.approveRequest(requestId, adminId)
  ↓
Backend updates:
  - employee_requests.status = 'approved'
  - employee_requests.reviewed_by = adminId
  - employee_requests.reviewed_at = NOW()
  - profiles.status = 'active'
  ↓
Employee can now login
```

**Rejection Process**:
```
Admin clicks "Reject"
  ↓
Admin optionally enters rejection reason
  ↓
Frontend calls adminApprovalService.rejectRequest(requestId, adminId, reason)
  ↓
Backend updates:
  - employee_requests.status = 'rejected'
  - employee_requests.rejection_reason = reason
  - employee_requests.reviewed_by = adminId
  - employee_requests.reviewed_at = NOW()
  - profiles.status = 'rejected'
  ↓
Employee cannot login
```

**Backend Service**: `admin-approval.service.ts`
- Uses service role client to bypass RLS
- Atomic updates to both tables
- Transaction-like behavior (both updates or none)

### 5.2 Office Management

**Screen**: `/admin/settings/locations`

**Functionality**:
1. View list of all offices
2. Add new office with GPS coordinates
3. Edit existing office details
4. Activate/deactivate offices
5. Set office radius for GPS verification

**Office Fields**:
- Name, Address, City, State, Country
- Latitude, Longitude (GPS coordinates)
- Radius (meters) for proximity check
- Active status (only one can be active)

**Single Office Mode**:
- UI allows managing multiple offices
- System enforces only one active office
- Activating an office deactivates others

**Backend Service**: `office.service.ts`

### 5.3 Attendance Window Configuration

**Screen**: `/admin/settings/window`

**Functionality**:
1. View current attendance window settings
2. Edit start time and end time
3. Configure grace period (0-60 minutes)
4. Toggle strict mode (GPS+WiFi verification)

**Configuration Options**:
- Start Time: When attendance window opens (e.g., 09:30 AM)
- End Time: When attendance window closes (e.g., 6:00 PM)
- Grace Period: Minutes after start time for on-time marking (0-60)
- Strict Mode: Enable/disable location verification

**Backend Service**: `attendance-settings.service.ts`
- Updates attendance_settings table
- Changes take effect immediately
- No restart required

### 5.4 HR Contacts Management

**Screen**: `/admin/settings/notifications`

**Functionality**:
1. View list of HR contacts
2. Add new contact (name, email, phone)
3. Edit existing contact
4. Enable/disable contact
5. Delete contact

**Contact Fields**:
- Name: Contact person name
- Email: For email notifications (optional)
- Phone: For SMS notifications (optional)
- Enabled: Whether to send notifications to this contact

**Validation**:
- At least one of email or phone must be provided
- Email format validation
- Phone format validation (international format)

**Backend Service**: `notification-settings.service.ts`

### 5.5 Notification Settings

**Screen**: `/admin/settings/notifications`

**Functionality**:
1. Configure 3 notification time slots
2. Enable/disable each slot
3. Set time for each slot
4. View notification history

**Slot Configuration**:
- Slot 1: Default 10:00 AM
- Slot 2: Default 2:00 PM
- Slot 3: Default 5:00 PM

**Notification Content**:
- Date and slot number
- Present count, late count, total count
- Attendance rate percentage
- Sent via both email and SMS

**Backend Service**: `notification-settings.service.ts`

### 5.6 Manual Notification Trigger

**Screen**: `/admin/reports` or `/admin/history`

**Functionality**:
1. Admin clicks "Send Alert" button
2. System fetches current attendance data
3. Sends notification to all enabled HR contacts
4. Shows success/failure count

**Trigger Process**:
```
Admin clicks "Send Alert"
  ↓
Frontend calls notificationTriggerService.triggerNotification()
  ↓
Backend fetches current attendance stats
  ↓
Backend calls /api/send-notification endpoint
  ↓
Serverless function sends emails and SMS
  ↓
Results logged to notification_history
  ↓
Frontend shows success message
```

**Backend Service**: `notification-trigger.service.ts`

### 5.7 History View

**Screen**: `/admin/history`

**Functionality**:
1. **Overview Tab**: Summary statistics and trends
2. **Attendance History Tab**: Grid view of employee attendance
3. **Reports & Export Tab**: Generate and download reports

**Overview Tab Features**:
- Time range selector (Today, Week, Month)
- Attendance rate with trend indicator
- Present/Late/Absent counts
- Daily breakdown chart

**Attendance History Tab Features**:
- 7-day attendance grid (employee × date)
- Search employees by name/email
- Filter by status (Present/Late/Absent)
- View modes: Grid, List, Calendar (calendar not implemented)

**Reports & Export Tab Features**:
- Select export format (CSV, PDF, Excel)
- Select time range (Today, Week, Month, Custom)
- Report templates (Daily, Weekly, Monthly, Employee-specific)
- Download button

**Backend Service**: `reports.service.ts`

### 5.8 Logout Handling

**Logout Process**:
```
Admin clicks logout
  ↓
Frontend calls authService.logout()
  ↓
Supabase Auth signs out user
  ↓
Session destroyed
  ↓
Redirect to /admin/login
```

**Session Cleanup**:
- Supabase Auth clears httpOnly cookie
- Frontend clears local state
- No manual token management required

---

## 6. NOTIFICATION SYSTEM (DETAILED TECHNICAL EXPLANATION)

### 6.1 notification_settings Table Usage

**Table Structure**:
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,
  slot_number INTEGER (1, 2, or 3),
  slot_time TIME,
  is_enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID
);
```

**Default Configuration**:
- Slot 1: 10:00:00, enabled
- Slot 2: 14:00:00, enabled
- Slot 3: 17:00:00, enabled

**Usage**:
- Scheduler checks enabled slots
- Sends notifications at configured times
- Admin can modify times and enable/disable slots

### 6.2 HR Contacts Logic

**Table Structure**:
```sql
CREATE TABLE notification_contacts (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  is_enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
);
```

**Contact Selection**:
- Only enabled contacts receive notifications
- Email sent if email field is not null
- SMS sent if phone field is not null
- Contact can have both email and phone

**Validation**:
- At least one of email or phone must be provided
- Email format: standard email validation
- Phone format: international format (e.g., +1234567890)
# NEXUS ATTENDO - TECHNICAL DOCUMENTATION (PART 2)

## 6. NOTIFICATION SYSTEM (CONTINUED)

### 6.3 Automatic Scheduling (node-cron)

**Note**: Automatic scheduling is NOT currently implemented in the production system.

**Planned Implementation**:
- Use node-cron for scheduled tasks
- Run on server/backend (not in browser)
- Check enabled slots every minute
- Send notifications when current time matches slot time

**Current Status**:
- Manual notifications work via "Send Alert" button
- Automatic scheduling requires backend server (not serverless)
- Supabase Edge Functions could be used for scheduling

### 6.4 Slot Calculation Logic

**Slot Matching**:
```typescript
// Pseudocode for scheduler (not implemented):
const now = getCurrentISTTime();
const currentTime = `${now.getHours()}:${now.getMinutes()}:00`;

const { slots } = await notificationSettingsService.getSlots();
const matchingSlot = slots.find(slot => 
  slot.is_enabled && slot.slot_time === currentTime
);

if (matchingSlot) {
  await sendNotifications(matchingSlot);
}
```

**Manual Trigger**:
- Uses current time as slot time
- Slot number set to 1 (arbitrary)
- Marked as manual in notification_history

### 6.5 SMS Sending (Twilio)

**Implementation**: `notification.service.ts`

**Process**:
```typescript
async sendSMSNotification(to: string, data: AttendanceNotificationData) {
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  
  const message = await client.messages.create({
    body: generateSMSContent(data),
    from: TWILIO_PHONE_NUMBER,
    to: to
  });
  
  return { success: true, messageId: message.sid };
}
```

**SMS Content Format**:
```
SLOT-1 Attendance Report - 17-Feb
Time: 10:00 AM
✓ Present: 45
⏰ Late: 5
📊 Total: 50
📈 Rate: 90%
```

**Character Limit**: SMS content kept under 160 characters for basic info

### 6.6 Email Sending (Resend)

**Implementation**: `notification.service.ts`

**Process**:
```typescript
async sendEmailNotification(to: string, data: AttendanceNotificationData) {
  const resend = new Resend(RESEND_API_KEY);
  
  const response = await resend.emails.send({
    from: 'Attendance System <onboarding@resend.dev>',
    to: [to],
    subject: `Attendance Report - Slot ${data.slotNumber}`,
    html: generateEmailHTML(data)
  });
  
  return { success: true, messageId: response.data.id };
}
```

**Email Content**:
- Professional HTML template
- Color-coded statistics
- Attendance rate badge
- Responsive design
- Company branding

### 6.7 Retry Logic (2 Retries)

**Implementation**:
```typescript
async sendWithRetry(type, to, data, retryCount = 0) {
  const result = await sendFunction(to, data);
  
  if (!result.success && retryCount === 0) {
    // Schedule retry after 5 minutes
    setTimeout(async () => {
      await sendWithRetry(type, to, data, 1);
    }, 5 * 60 * 1000);
  }
  
  return result;
}
```

**Retry Strategy**:
- Initial attempt: Immediate
- Retry 1: After 5 minutes if initial fails
- Retry 2: After 5 minutes if retry 1 fails
- Total attempts: 3 (1 initial + 2 retries)

**Failure Handling**:
- Each attempt logged to notification_history
- Failures don't block other notifications
- Email failures don't affect SMS, and vice versa

### 6.8 Failure Logging

**Table**: `notification_history`

**Logged Data**:
- Slot number and time
- Notification date
- Recipient (email or phone)
- Notification type (email/sms)
- Status (success/failed)
- Message ID (from provider)
- Error message (if failed)
- Attendance data (JSON)
- Triggered by (admin ID)
- Is manual (boolean)
- Sent timestamp

**Query Example**:
```sql
SELECT * FROM notification_history
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### 6.9 notification_history Table Usage

**Purpose**: Audit trail for all notification attempts

**Use Cases**:
1. View notification history in admin panel
2. Debug failed notifications
3. Track notification delivery rates
4. Compliance and auditing

**Retention**: No automatic cleanup (grows indefinitely)

### 6.10 Working Day Logic (Mon–Fri)

**Note**: Working day filtering is NOT currently implemented.

**Planned Logic**:
```typescript
const now = new Date();
const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday

if (dayOfWeek === 0 || dayOfWeek === 6) {
  // Skip notifications on weekends
  return;
}
```

**Current Behavior**: Notifications sent every day if manually triggered

### 6.11 Timezone Handling

**Notification Times**: All times in IST (Asia/Kolkata)

**Conversion Points**:
1. Slot times stored as TIME (no timezone)
2. Current time converted to IST for comparison
3. Notification timestamps stored as TIMESTAMPTZ (UTC)
4. Display times converted to IST in UI

**Critical**: System assumes IST timezone throughout

### 6.12 Scheduler Flow (Planned)

**Automatic Notification Flow** (Not Implemented):
```
1. Cron job runs every minute
   ↓
2. Get current IST time
   ↓
3. Query enabled notification slots
   ↓
4. Find slot matching current time
   ↓
5. If match found:
   - Fetch current attendance data
   - Get enabled HR contacts
   - Send notifications to all contacts
   - Log results to notification_history
   ↓
6. Wait for next minute
```

**Manual Notification Flow** (Implemented):
```
1. Admin clicks "Send Alert"
   ↓
2. Frontend calls notificationTriggerService
   ↓
3. Backend fetches current attendance data
   ↓
4. Backend calls /api/send-notification
   ↓
5. Serverless function:
   - Gets enabled contacts
   - Sends emails via Resend
   - Sends SMS via Twilio
   - Logs results
   ↓
6. Returns success/failure counts
   ↓
7. Frontend shows toast notification
```

---

## 7. DATABASE SCHEMA OVERVIEW

### 7.1 profiles Table

**Purpose**: Store user profiles with role and status

**Key Fields**:
- `id` (UUID, PK): References auth.users(id)
- `email` (TEXT, UNIQUE): User email
- `full_name` (TEXT): User's full name
- `role` (TEXT): 'employee' or 'admin'
- `status` (TEXT): 'pending', 'active', 'rejected', 'blocked'
- `office_location` (UUID, FK): References offices(id)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- One-to-one with auth.users
- Many-to-one with offices

**Constraints**:
- role CHECK: IN ('employee', 'admin')
- status CHECK: IN ('pending', 'active', 'rejected', 'blocked')
- email UNIQUE

**Security**:
- RLS enabled
- Users can read own profile
- Users can update own profile
- Admin operations use service role

### 7.2 offices Table

**Purpose**: Store office locations with GPS coordinates

**Key Fields**:
- `id` (UUID, PK)
- `name` (TEXT): Office name
- `address`, `city`, `state`, `country` (TEXT)
- `latitude`, `longitude` (DECIMAL): GPS coordinates
- `radius_meters` (INTEGER): Proximity radius for GPS check
- `wifi_ssids` (TEXT[]): Array of Wi-Fi SSIDs (deprecated)
- `is_active` (BOOLEAN): Only one can be true
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- One-to-many with profiles
- One-to-many with office_networks
- One-to-many with attendance

**Constraints**:
- Only one office can have is_active=true (enforced in application)

**Security**:
- RLS enabled
- Anyone can read active offices
- Admin operations use service role

### 7.3 office_networks Table

**Purpose**: Store Wi-Fi network configurations per office

**Key Fields**:
- `id` (UUID, PK)
- `office_id` (UUID, FK): References offices(id)
- `network_name` (TEXT): Wi-Fi SSID
- `ip_range` (TEXT): IP prefix for matching (e.g., "192.168.1")
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Many-to-one with offices

**Constraints**:
- None

**Security**:
- RLS enabled
- Authenticated users can read
- Admin operations use service role

### 7.4 employee_requests Table

**Purpose**: Registration approval queue

**Key Fields**:
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE): References auth.users(id)
- `full_name`, `email` (TEXT)
- `office_id` (UUID, FK): References offices(id)
- `status` (TEXT): 'pending', 'approved', 'rejected'
- `rejection_reason` (TEXT, nullable)
- `reviewed_by` (UUID, FK, nullable): References profiles(id)
- `reviewed_at` (TIMESTAMPTZ, nullable)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- One-to-one with auth.users
- Many-to-one with offices
- Many-to-one with profiles (reviewer)

**Constraints**:
- user_id UNIQUE (one request per user)
- status CHECK: IN ('pending', 'approved', 'rejected')

**Security**:
- RLS enabled
- Users can read own request
- Admin operations use service role

### 7.5 attendance Table

**Purpose**: Daily attendance records

**Key Fields**:
- `id` (UUID, PK)
- `user_id` (UUID, FK): References auth.users(id)
- `date` (DATE): Attendance date
- `check_in_time` (TIMESTAMPTZ): Check-in timestamp (UTC)
- `check_out_time` (TIMESTAMPTZ, nullable): Not used
- `status` (TEXT): 'present', 'late', 'absent'
- `office_id` (UUID, FK): References offices(id)
- `latitude`, `longitude` (DECIMAL, nullable): GPS coordinates
- `ip_address` (TEXT, nullable): Client IP
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Many-to-one with auth.users
- Many-to-one with offices

**Constraints**:
- UNIQUE(user_id, date): One attendance per user per day
- status CHECK: IN ('present', 'late', 'absent')

**Security**:
- RLS enabled
- Users can read own attendance
- Users can insert own attendance
- Admin operations use service role

### 7.6 attendance_settings Table

**Purpose**: Configurable attendance windows

**Key Fields**:
- `id` (UUID, PK)
- `setting_name` (TEXT, UNIQUE): Identifier
- `start_time` (TIME): Window start
- `end_time` (TIME): Window end
- `grace_period_minutes` (INTEGER): Grace period (0-60)
- `strict_mode` (BOOLEAN): Enable GPS+WiFi verification
- `is_active` (BOOLEAN): Active setting
- `updated_by` (UUID, FK, nullable): References profiles(id)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Many-to-one with profiles (updater)

**Constraints**:
- setting_name UNIQUE
- grace_period_minutes CHECK: >= 0 AND <= 60

**Security**:
- RLS enabled
- Authenticated users can read active settings
- Admin operations use service role

### 7.7 notification_settings Table

**Purpose**: Notification time slots

**Key Fields**:
- `id` (UUID, PK)
- `slot_number` (INTEGER): 1, 2, or 3
- `slot_time` (TIME): Notification time
- `is_enabled` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- `updated_by` (UUID, FK, nullable): References profiles(id)

**Relationships**:
- Many-to-one with profiles (updater)

**Constraints**:
- slot_number CHECK: IN (1, 2, 3)

**Security**:
- RLS enabled
- Authenticated users can read
- Admin operations use service role

### 7.8 notification_contacts Table

**Purpose**: HR contact list

**Key Fields**:
- `id` (UUID, PK)
- `name` (TEXT): Contact name
- `email` (TEXT, nullable): Email address
- `phone` (TEXT, nullable): Phone number
- `is_enabled` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK, nullable): References profiles(id)

**Relationships**:
- Many-to-one with profiles (creator)

**Constraints**:
- At least one of email or phone must be provided (enforced in application)

**Security**:
- RLS enabled
- Authenticated users can read
- Admin operations use service role

### 7.9 notification_history Table

**Purpose**: Notification delivery logs

**Key Fields**:
- `id` (UUID, PK)
- `slot_number` (INTEGER)
- `slot_time` (TEXT)
- `notification_date` (DATE)
- `recipient_email` (TEXT, nullable)
- `recipient_phone` (TEXT, nullable)
- `notification_type` (TEXT): 'email' or 'sms'
- `status` (TEXT): 'success' or 'failed'
- `message_id` (TEXT, nullable): Provider message ID
- `error_message` (TEXT, nullable)
- `attendance_data` (JSONB): Attendance statistics
- `sent_at` (TIMESTAMPTZ)
- `triggered_by` (UUID, FK, nullable): References profiles(id)
- `is_manual` (BOOLEAN): Manual vs automatic
- `created_at` (TIMESTAMPTZ)

**Relationships**:
- Many-to-one with profiles (trigger)

**Constraints**:
- notification_type CHECK: IN ('email', 'sms')
- status CHECK: IN ('success', 'failed')

**Security**:
- RLS enabled
- Authenticated users can read
- Admin operations use service role

---

## 8. SECURITY MODEL

### 8.1 Row Level Security (RLS)

**Status**: Enabled on all tables

**Policy Strategy**:
- Users can read/update own data
- Admin operations bypass RLS using service role key
- Public data (active offices) readable by anyone

**Example Policies**:
```sql
-- Users can read own profile
CREATE POLICY "enable_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert own attendance
CREATE POLICY "enable_insert_own_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**Limitations**:
- RLS policies can cause circular reference issues
- Admin operations use service role to avoid RLS complexity
- Some operations require service role for performance

### 8.2 Service Role Key Usage

**When Used**:
- Admin approval/rejection operations
- Admin viewing all attendance records
- Admin managing offices and networks
- Notification system accessing all data
- Bulk operations requiring full access

**Security Measures**:
- Service role key never exposed to frontend
- Only used in backend services
- Stored in environment variables
- Not committed to version control

**Access Pattern**:
```typescript
// Anon key client (frontend)
import { supabase } from './supabase/client';

// Service role client (backend)
import { supabaseAdmin } from './supabase/api-client';
```

### 8.3 Environment Variable Handling

**Storage**:
- Development: `.env` file (gitignored)
- Production: Vercel environment variables

**Access Control**:
- `VITE_*` prefix: Exposed to frontend (public keys only)
- No prefix: Backend-only (sensitive keys)

**Sensitive Variables**:
- `RESEND_API_KEY`: Email service key
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`: SMS service keys
- Service role key (not in .env, hardcoded in api-client.ts)

**Best Practices**:
- Never commit `.env` files
- Use `.env.example` for templates
- Rotate keys regularly
- Use different keys for dev/prod

### 8.4 API Key Protection

**Supabase Keys**:
- Anon key: Safe to expose (respects RLS)
- Service role key: Must be protected (bypasses RLS)

**Third-Party Keys**:
- Resend API key: Backend-only
- Twilio credentials: Backend-only

**Exposure Prevention**:
- Service role key hardcoded in backend (not ideal, but isolated)
- Third-party keys loaded from environment
- No keys in frontend bundle

### 8.5 Data Exposure Boundaries

**Frontend Access**:
- Own profile data
- Own attendance records
- Active offices (public)
- Attendance window settings (public)

**Admin Access** (via service role):
- All profiles
- All attendance records
- All offices and networks
- All settings
- All notification data

**API Endpoints**:
- `/api/send-notification`: Protected by backend logic
- All other operations via Supabase client

### 8.6 Known Security Limitations

1. **Service Role Key Hardcoded**:
   - Service role key is hardcoded in `api-client.ts`
   - Should be moved to environment variable
   - Currently isolated to backend, not exposed to frontend

2. **IP-Based Wi-Fi Verification**:
   - IP prefix matching is not secure
   - Can be spoofed or bypassed
   - Recommended: Use SSID verification via native app

3. **GPS Spoofing**:
   - GPS coordinates can be spoofed by determined users
   - No server-side GPS validation
   - Recommended: Implement additional verification methods

4. **No Rate Limiting**:
   - No rate limiting on attendance marking
   - Could be abused for repeated attempts
   - Mitigated by duplicate check and window restrictions

5. **Trial Account Limitations**:
   - Resend trial account has sending limits
   - Twilio trial account has restrictions
   - Production deployment requires paid accounts

6. **No Encryption at Rest**:
   - Database encryption depends on Supabase configuration
   - Sensitive data (GPS, IP) stored in plain text
   - Recommended: Enable database encryption

7. **Session Management**:
   - Session expiry handled by Supabase
   - No custom session timeout logic
   - No multi-device session management

---

## 9. ERROR HANDLING STRATEGY

### 9.1 Error Codes

**Attendance Errors**:
- `UNAUTHORIZED`: Authentication failure
- `NOT_EMPLOYEE`: Role mismatch
- `ACCOUNT_NOT_ACTIVE`: Status restriction
- `NO_OFFICE_ASSIGNED`: Missing office
- `ATTENDANCE_CLOSED`: Outside window
- `GPS_REQUIRED`: Missing GPS data
- `OUTSIDE_OFFICE_LOCATION`: GPS verification failed
- `OFFICE_WIFI_REQUIRED`: Wi-Fi verification failed
- `ATTENDANCE_ALREADY_MARKED`: Duplicate attempt
- `VALIDATION_FAILED`: Generic error

**Auth Errors**:
- `AuthError`: Supabase auth failure
- `ProfileError`: Profile not found
- `StatusError`: Status-based restriction

### 9.2 Frontend Error Handling

**Pattern**:
```typescript
const result = await service.operation();

if (result.error) {
  toast({
    title: "Error",
    description: result.error.message,
    variant: "destructive"
  });
  return;
}

// Success handling
```

**Error Display**:
- Toast notifications for user-facing errors
- Error screens for critical failures
- Inline validation errors for forms

### 9.3 Logging Strategy

**Console Logging**:
- Extensive logging in attendance marking flow
- Step-by-step validation logging
- GPS and Wi-Fi verification logging
- Notification sending logging

**Log Levels**:
- Info: Normal operations
- Warning: Non-critical issues
- Error: Failures and exceptions

**Production Logging**:
- Console logs visible in Vercel function logs
- No centralized logging system
- Recommended: Implement logging service (e.g., Sentry)

### 9.4 Retry Mechanisms

**Notification Retries**:
- 2 retries with 5-minute delay
- Implemented in `notification.service.ts`
- Each attempt logged separately

**Database Retries**:
- Handled by Supabase client
- Automatic retry on transient failures
- No custom retry logic

### 9.5 Failure Scenarios

**Attendance Marking Failures**:
1. GPS unavailable → Error: "Location permission required"
2. Outside office → Error: "Not inside office premises"
3. Wrong Wi-Fi → Error: "Connect to office Wi-Fi"
4. Window closed → Error: "Attendance is currently closed"
5. Already marked → Error: "Attendance already marked"

**Notification Failures**:
1. No enabled contacts → Error: "No enabled contacts found"
2. Email send failure → Logged, retry scheduled
3. SMS send failure → Logged, retry scheduled
4. API key invalid → Error: "Service configuration error"

**Database Failures**:
1. Connection timeout → Error: "Database connection failed"
2. Constraint violation → Error: "Operation not allowed"
3. RLS policy block → Error: "Permission denied"

---

## 10. DEPLOYMENT & ENVIRONMENT SETUP

### 10.1 Required Environment Variables

**Supabase**:
```bash
VITE_SUPABASE_URL=https://falbkccaqjqdbvrmdlll.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

**Resend (Email)**:
```bash
RESEND_API_KEY=<your_resend_api_key>
```

**Twilio (SMS)**:
```bash
TWILIO_ACCOUNT_SID=<your_twilio_sid>
TWILIO_AUTH_TOKEN=<your_twilio_auth_token>
TWILIO_PHONE_NUMBER=<your_twilio_number>
```

### 10.2 Supabase Configuration

**Setup Steps**:
1. Create Supabase project
2. Run `COMPLETE_DATABASE_SETUP.sql` in SQL Editor
3. Create admin user in Authentication panel
4. Insert admin profile using SQL
5. Configure RLS policies (included in setup script)
6. Enable email auth in Authentication settings

**Database URL**: Auto-configured by Supabase
**Connection Pooling**: Handled by Supabase
**Backups**: Automatic (Supabase feature)

### 10.3 Twilio Setup

**Steps**:
1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credentials to environment variables
5. Verify phone numbers (trial account)

**Trial Limitations**:
- Can only send to verified numbers
- SMS includes trial message prefix
- Limited sending volume

### 10.4 Resend Setup

**Steps**:
1. Create Resend account
2. Get API key
3. Add key to environment variables
4. Verify domain (optional, for custom from address)

**Trial Limitations**:
- Limited to `onboarding@resend.dev` from address
- Sending volume restrictions
- No custom domain

### 10.5 Local Development

**Setup**:
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# (Supabase, Resend, Twilio)

# Run development server
npm run dev
```

**Access**:
- Frontend: `http://localhost:8081`
- API endpoint: `http://localhost:8081/api/send-notification`

**Hot Reload**: Enabled via Vite HMR

### 10.6 Testing Notifications

**Manual Test**:
1. Login as admin
2. Navigate to Reports page
3. Click "Send Alert" button
4. Check console for logs
5. Verify email/SMS received

**Test Contacts**:
- Add test contact in Notification Settings
- Use your own email/phone for testing
- Enable contact before testing

**Debugging**:
- Check Vercel function logs
- Check browser console
- Check notification_history table

### 10.7 Build Process

**Development Build**:
```bash
npm run build:dev
```

**Production Build**:
```bash
npm run build
```

**Build Output**:
- Location: `dist/` folder
- Assets: Bundled and minified
- Source maps: Generated for debugging

**Deployment**:
```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy:prod
```

**Vercel Configuration**:
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Node version: 18.x

---

## 11. CURRENT LIMITATIONS

### 11.1 Demo-Mode Wi-Fi Limitations

**Issue**: IP prefix matching is not production-ready

**Details**:
- Current implementation matches IP address prefix (e.g., "192.168.1")
- Works for static IP ranges
- Fails with dynamic IPs or DHCP
- Can be bypassed with VPN or proxy

**Impact**:
- Not suitable for production deployment
- Requires manual IP range configuration
- No automatic network detection

**Workaround**:
- Use strict mode toggle to disable Wi-Fi verification
- Rely on GPS verification only
- Implement SSID verification in native app

### 11.2 Trial Provider Restrictions

**Resend (Email)**:
- Limited to `onboarding@resend.dev` from address
- Sending volume restrictions
- No custom domain without verification
- May have deliverability issues

**Twilio (SMS)**:
- Trial account can only send to verified numbers
- SMS includes "Sent from your Twilio trial account" prefix
- Limited sending volume
- Geographic restrictions

**Impact**:
- Cannot send to arbitrary recipients in trial mode
- Professional appearance compromised
- Volume limitations for testing

**Solution**: Upgrade to paid accounts for production

### 11.3 Missing Check-Out Feature

**Status**: Not implemented

**Details**:
- Database has `check_out_time` field
- No UI or logic for check-out
- Attendance records only track check-in

**Impact**:
- Cannot calculate work hours
- Cannot track early departures
- Limited attendance analytics

**Workaround**: None (feature not required for current use case)

### 11.4 Single Office Mode

**Status**: Enforced in application logic

**Details**:
- Database supports multiple offices
- UI allows managing multiple offices
- Only one office can be active
- All employees assigned to active office

**Impact**:
- Cannot support multi-office deployments
- Office selection in registration is cosmetic
- Attendance verification uses single office

**Future**: Multi-office support requires UI and logic updates

### 11.5 No Automatic Scheduling

**Status**: Not implemented

**Details**:
- Notification slots configured but not used
- No cron job or scheduler running
- Only manual notifications work

**Impact**:
- Admin must manually trigger notifications
- No automatic daily reports
- Notification slots are unused

**Solution**: Implement scheduler using Supabase Edge Functions or external cron service

### 11.6 No Mobile App

**Status**: Web-only application

**Details**:
- Responsive web design for mobile browsers
- No native iOS/Android app
- Limited access to device features

**Impact**:
- Cannot verify Wi-Fi SSID directly
- GPS accuracy may vary
- No push notifications
- No offline support

**Workaround**: Use mobile web browser

### 11.7 IST Timezone Hardcoded

**Status**: System assumes IST (Asia/Kolkata)

**Details**:
- All time calculations in IST
- No timezone configuration
- Will not work correctly in other timezones

**Impact**:
- Cannot deploy in other countries
- Time-based features will fail outside IST

**Solution**: Implement timezone configuration and conversion

### 11.8 No Data Export Scheduling

**Status**: Manual export only

**Details**:
- Reports can be exported on-demand
- No scheduled report generation
- No automatic email delivery of reports

**Impact**:
- Admin must manually generate reports
- No automated reporting workflow

**Future**: Implement scheduled report generation

### 11.9 Limited Analytics

**Status**: Basic statistics only

**Details**:
- Present/Late/Absent counts
- Attendance rate calculation
- Daily breakdown chart
- No advanced analytics

**Missing**:
- Trend analysis
- Predictive analytics
- Department-wise comparison
- Employee performance metrics

**Future**: Implement advanced analytics dashboard

### 11.10 No Audit Trail

**Status**: Limited audit logging

**Details**:
- Notification history logged
- Attendance records have timestamps
- No comprehensive audit trail

**Missing**:
- Profile changes history
- Settings changes history
- Admin action logs
- Login/logout logs

**Impact**:
- Cannot track who changed what
- Limited compliance support
- Difficult to debug issues

**Future**: Implement comprehensive audit logging

---

## CONCLUSION

This documentation provides a complete technical overview of the Nexus Attendo attendance management system as currently implemented. The system is production-ready for single-office deployments with manual notification triggers. Several limitations exist that should be addressed before large-scale production deployment, particularly around Wi-Fi verification, automatic scheduling, and multi-office support.

**System Strengths**:
- Robust authentication and authorization
- Database-driven configuration
- Comprehensive validation logic
- Flexible notification system
- Professional reporting capabilities

**Recommended Next Steps**:
1. Upgrade to paid Resend and Twilio accounts
2. Implement automatic notification scheduling
3. Enhance Wi-Fi verification method
4. Add comprehensive audit logging
5. Implement timezone configuration
6. Develop native mobile app for better device integration

**Maintenance Notes**:
- Regular database backups via Supabase
- Monitor notification delivery rates
- Review and rotate API keys quarterly
- Update dependencies regularly
- Monitor Vercel function logs for errors

---

**Document Version**: 1.0.0  
**Last Updated**: February 17, 2026  
**Maintained By**: Development Team
