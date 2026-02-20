# 🚀 Feature Implementation Plan
## Nexus Attendo - Phase 3 Enhancements

---

# 📋 Features to Implement

1. **Leave Management System**
2. **Holiday & Weekend Management**
3. **Employee Performance Dashboard**
4. **Enhanced Checkout Functionality**

---

# 🎯 Feature 1: Leave Management System

## Database Schema

```sql
-- Leave types table
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL, -- 'Sick Leave', 'Casual Leave', 'Vacation', etc.
  code VARCHAR(20) NOT NULL UNIQUE, -- 'SL', 'CL', 'VL', etc.
  description TEXT,
  max_days_per_year INTEGER DEFAULT 12,
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employee leave balance
CREATE TABLE leave_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0,
  remaining_days DECIMAL(5,2) GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id, year)
);

-- Leave requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leave request attachments (optional - for medical certificates, etc.)
CREATE TABLE leave_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default leave types
INSERT INTO leave_types (name, code, description, max_days_per_year, is_paid) VALUES
('Sick Leave', 'SL', 'For medical reasons', 12, true),
('Casual Leave', 'CL', 'For personal reasons', 12, true),
('Vacation Leave', 'VL', 'Annual vacation', 15, true),
('Unpaid Leave', 'UL', 'Leave without pay', 365, false),
('Maternity Leave', 'ML', 'For maternity', 180, true),
('Paternity Leave', 'PL', 'For paternity', 15, true);
```

## Backend Services

### `leave.service.ts`
```typescript
- getLeaveTypes(): Get all active leave types
- getLeaveBalance(userId, year): Get employee's leave balance
- applyLeave(data): Submit leave request
- getLeaveRequests(userId?, status?): Get leave requests (filtered)
- approveLeave(requestId, adminId): Approve leave request
- rejectLeave(requestId, adminId, reason): Reject leave request
- cancelLeave(requestId, userId): Cancel leave request
- getLeaveCalendar(month, year): Get all approved leaves for calendar view
- calculateLeaveDays(startDate, endDate): Calculate working days (excluding weekends/holidays)
```

## Admin Screens

### 1. Leave Types Management (`/admin/settings/leave-types`)
- List all leave types
- Add/Edit/Delete leave types
- Configure max days per year
- Enable/disable leave types

### 2. Leave Requests (`/admin/leave-requests`)
- View all pending leave requests
- Filter by status, employee, date range
- Approve/Reject with reason
- View leave history
- Bulk approve/reject

### 3. Leave Calendar (`/admin/leave-calendar`)
- Monthly calendar view
- Show all approved leaves
- Color-coded by leave type
- Click to view details

### 4. Leave Balance Management (`/admin/leave-balance`)
- View all employees' leave balance
- Manually adjust balance (with reason)
- Bulk balance allocation for new year
- Export leave balance report

## Employee Screens

### 1. Apply Leave (`/employee/apply-leave`)
- Select leave type
- Date range picker
- Reason text area
- Show available balance
- Submit request

### 2. My Leaves (`/employee/my-leaves`)
- View all leave requests
- Filter by status
- Cancel pending requests
- View leave balance

### 3. Leave Balance (`/employee/leave-balance`)
- Show balance for each leave type
- Visual progress bars
- Leave history

## Integration with Attendance

- Auto-mark attendance as "On Leave" for approved leave dates
- Don't count leave days as absent
- Update leave balance when leave is approved
- Restore balance if leave is cancelled

---

# 🎉 Feature 2: Holiday & Weekend Management

## Database Schema

```sql
-- Holidays table
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('public', 'optional', 'restricted')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false, -- For annual holidays like Independence Day
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Weekend configuration
CREATE TABLE weekend_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  is_weekend BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Insert default weekend (Saturday & Sunday)
INSERT INTO weekend_config (day_of_week, is_weekend) VALUES
(0, true),  -- Sunday
(6, true);  -- Saturday

-- Insert sample holidays
INSERT INTO holidays (name, date, type, description, is_recurring) VALUES
('New Year', '2026-01-01', 'public', 'New Year Day', true),
('Republic Day', '2026-01-26', 'public', 'Republic Day of India', true),
('Independence Day', '2026-08-15', 'public', 'Independence Day of India', true),
('Gandhi Jayanti', '2026-10-02', 'public', 'Birthday of Mahatma Gandhi', true),
('Diwali', '2026-11-01', 'public', 'Festival of Lights', false);
```

## Backend Services

### `holiday.service.ts`
```typescript
- getHolidays(year?): Get all holidays for a year
- addHoliday(data): Add new holiday
- updateHoliday(id, data): Update holiday
- deleteHoliday(id): Delete holiday
- isHoliday(date): Check if date is a holiday
- getUpcomingHolidays(limit): Get next N holidays
```

### `weekend.service.ts`
```typescript
- getWeekendConfig(): Get weekend configuration
- updateWeekendConfig(config): Update which days are weekends
- isWeekend(date): Check if date is a weekend
- getWorkingDays(startDate, endDate): Calculate working days
```

## Admin Screens

### 1. Holiday Calendar (`/admin/settings/holidays`)
- Calendar view with holidays marked
- Add/Edit/Delete holidays
- Import holidays from CSV
- Mark recurring holidays
- Filter by type (public/optional/restricted)

### 2. Weekend Configuration (`/admin/settings/weekends`)
- Checkbox for each day of week
- Save configuration
- Preview calendar with weekends highlighted

## Employee Screens

### 1. Holiday List (`/employee/holidays`)
- List of all holidays
- Calendar view
- Filter by month
- Countdown to next holiday

## Integration with Attendance

- Don't mark employees absent on holidays
- Don't mark employees absent on weekends
- Show "Holiday" or "Weekend" status in attendance
- Exclude holidays/weekends from leave calculations

---

# 📊 Feature 3: Employee Performance Dashboard

## Database Schema

```sql
-- Performance metrics table
CREATE TABLE employee_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month
  
  -- Attendance metrics
  total_working_days INTEGER NOT NULL,
  present_days INTEGER DEFAULT 0,
  late_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  
  -- Scores (0-100)
  attendance_score DECIMAL(5,2),
  punctuality_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  
  -- Time metrics
  avg_check_in_time TIME,
  total_work_hours DECIMAL(10,2),
  avg_work_hours_per_day DECIMAL(5,2),
  
  -- Comparisons
  team_avg_score DECIMAL(5,2),
  rank_in_team INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Performance badges/achievements
CREATE TABLE performance_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name or emoji
  criteria JSONB, -- Criteria for earning badge
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employee badges earned
CREATE TABLE employee_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES performance_badges(id),
  earned_date DATE NOT NULL,
  month DATE, -- Month for which badge was earned
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id, month)
);

-- Insert default badges
INSERT INTO performance_badges (name, description, icon, criteria) VALUES
('Perfect Attendance', '100% attendance for the month', '🏆', '{"attendance_score": 100}'),
('Always On Time', 'No late arrivals for the month', '⏰', '{"late_days": 0}'),
('Star Performer', 'Overall score above 95%', '⭐', '{"overall_score": 95}'),
('Consistent', '30 days streak of on-time check-ins', '🔥', '{"streak_days": 30}'),
('Early Bird', 'Checked in before 9:30 AM every day', '🌅', '{"early_checkins": "all"}');
```

## Backend Services

### `performance.service.ts`
```typescript
- calculateMonthlyPerformance(userId, month): Calculate performance metrics
- getEmployeePerformance(userId, month): Get performance data
- getAllPerformances(month): Get all employees' performance
- getPerformanceTrends(userId, months): Get trends over time
- getTopPerformers(month, limit): Get top N performers
- awardBadges(userId, month): Check and award badges
- getEmployeeBadges(userId): Get all badges earned
- compareWithTeam(userId, month): Compare with team average
```

## Admin Screens

### 1. Performance Dashboard (`/admin/performance`)
- Overview cards: Top performers, average scores, trends
- Employee performance cards (grid view)
- Filters: Department, month, score range
- Sort by: Score, attendance, punctuality
- Export performance report

### 2. Performance Details (`/admin/performance/:userId`)
- Detailed metrics for one employee
- Monthly trends (line charts)
- Comparison with team
- Badges earned
- Performance history

### 3. Performance Reports (`/admin/performance/reports`)
- Generate monthly/quarterly/annual reports
- Department-wise comparison
- Downloadable PDF/Excel
- Email reports to stakeholders

## Employee Screens

### 1. My Performance (`/employee/performance`)
- Performance score card
- Attendance breakdown
- Punctuality rating
- Badges earned
- Monthly trends
- Comparison with team average

### 2. Performance History (`/employee/performance/history`)
- Month-by-month performance
- Charts and graphs
- Download performance certificate

## Calculations

```typescript
// Attendance Score
attendance_score = (present_days / total_working_days) × 100

// Punctuality Score
punctuality_score = ((present_days - late_days) / present_days) × 100

// Overall Score
overall_score = (attendance_score × 0.6) + (punctuality_score × 0.4)

// Rank
rank_in_team = Position when sorted by overall_score DESC
```

---

# 🚪 Feature 4: Enhanced Checkout Functionality

## Database Updates

```sql
-- Add default checkout time to attendance_settings
ALTER TABLE attendance_settings 
ADD COLUMN IF NOT EXISTS default_checkout_time TIME DEFAULT '18:30:00',
ADD COLUMN IF NOT EXISTS auto_checkout_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_work_hours DECIMAL(4,2) DEFAULT 8.0;

-- Update existing record
UPDATE attendance_settings 
SET 
  default_checkout_time = '18:30:00',
  auto_checkout_enabled = true,
  min_work_hours = 8.0
WHERE setting_name = 'default_attendance_window';

-- Add work hours calculation
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS work_hours DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN check_out_time IS NOT NULL AND check_in_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600
    ELSE NULL
  END
) STORED;
```

## Backend Services

### Update `attendance.service.ts`
```typescript
// New methods
- checkOut(userId, location, deviceInfo): Manual checkout
- getCheckoutStatus(userId, date): Check if already checked out
- calculateWorkHours(checkIn, checkOut): Calculate work duration
- getDefaultCheckoutTime(): Get from settings
- canCheckOut(userId, date): Validate checkout eligibility

// Updated methods
- markAttendance(): Add checkout_allowed flag to response
```

### Update `attendance-settings.service.ts`
```typescript
- getCheckoutSettings(): Get checkout configuration
- updateCheckoutSettings(data): Update checkout settings
- getDefaultCheckoutTime(): Get default checkout time
- updateDefaultCheckoutTime(time): Update default time
```

## Admin Screens

### 1. Checkout Settings (`/admin/settings/checkout`)
- Default checkout time (time picker)
- Enable/disable auto-checkout toggle
- Minimum work hours requirement
- Early checkout policy
- Overtime threshold

### 2. Checkout Reports (`/admin/reports/checkout`)
- Daily checkout summary
- Early checkouts list
- Late checkouts list
- Average work hours
- Overtime report

## Employee Screens (Web)

### 1. Dashboard Updates (`/dashboard`)
- Show "Check Out" button after check-in
- Display current work duration (live timer)
- Show checkout time after checkout
- Disable button after checkout

### 2. Checkout Confirmation (`/checkout-confirm`)
- Show total work hours
- Confirm checkout
- Success message

## Employee Screens (Mobile)

### 1. Dashboard Updates
- Same as web
- Native time display
- Push notification reminder at default checkout time

### 2. Checkout Screen
- Large checkout button
- Work duration display
- Location verification (optional)
- Success animation

## Auto-Checkout Cron Job

### Update `supabase/functions/auto-checkout-cron/index.ts`
```typescript
// Changes:
1. Read default_checkout_time from attendance_settings
2. Check if auto_checkout_enabled
3. Only auto-checkout if check_out_time IS NULL
4. Set checkout time to default_checkout_time
5. Log auto-checkout actions
6. Send notification to employees who were auto-checked-out
```

## Validation Rules

1. Can't checkout before check-in
2. Can't checkout twice on same day
3. Can't checkout on future dates
4. Can't checkout before minimum work hours (warning only)
5. Location verification (optional, configurable)

## Notifications

- Reminder notification 30 mins before default checkout time
- Notification when auto-checked-out
- Admin notification for early checkouts (< min work hours)

---

# 📅 Implementation Timeline (8 Weeks)

## Week 1-2: Checkout Enhancement
- Database updates
- Backend services
- Admin settings UI
- Employee checkout UI (web & mobile)
- Auto-checkout cron update
- Testing

## Week 3-4: Holiday & Weekend Management
- Database schema
- Backend services
- Admin holiday calendar
- Weekend configuration
- Integration with attendance
- Testing

## Week 5-6: Leave Management System
- Database schema (complex)
- Backend services
- Admin leave management screens
- Employee leave screens
- Leave balance calculations
- Integration with attendance
- Testing

## Week 7-8: Performance Dashboard
- Database schema
- Performance calculation logic
- Admin performance dashboard
- Employee performance screens
- Badge system
- Reports generation
- Testing & optimization

---

# 🎯 Priority Order

1. **Checkout Enhancement** (Week 1-2) - Most critical
2. **Holiday & Weekend Management** (Week 3-4) - Prevents false absences
3. **Leave Management** (Week 5-6) - Essential HR feature
4. **Performance Dashboard** (Week 7-8) - Analytics & insights

---

# 📦 Deliverables

## For Each Feature:

1. **Database Migration Files**
   - SQL files for schema changes
   - Seed data for initial setup

2. **Backend Services**
   - TypeScript service files
   - Type definitions
   - API endpoints

3. **Admin Screens**
   - React components
   - Routing configuration
   - Navigation updates

4. **Employee Screens**
   - Web screens (React)
   - Mobile screens (React Native)
   - Shared components

5. **Documentation**
   - API documentation
   - User guides (admin & employee)
   - Database schema documentation
   - Deployment guide

6. **Testing**
   - Unit tests
   - Integration tests
   - Manual test cases

---

# 🔧 Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile**: React Native, Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Cron Jobs**: Supabase Edge Functions
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Forms**: React Hook Form + Zod

---

# 📝 Notes

1. All times stored in UTC, displayed in IST
2. All dates use ISO format (YYYY-MM-DD)
3. Decimal precision for leave days (0.5 for half-day)
4. Performance calculations run nightly via cron
5. Badge awards automated monthly
6. Auto-checkout runs daily at configured time
7. Leave balance resets annually (configurable)

---

# 🚀 Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create feature branches
4. Start with Checkout Enhancement (Week 1-2)
5. Regular progress updates
6. Testing after each feature
7. Deployment to staging
8. User acceptance testing
9. Production deployment

---

**Ready to start implementation!** 🎉
