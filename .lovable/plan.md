

# Admin Portal Enhancement Plan

## Overview
This plan adds comprehensive functionality to the admin portal including employee detail views, report exports, working settings screens, and proper logout functionality with confirmation.

---

## New Files to Create

### 1. Employee Detail Screen (`src/pages/admin/AdminEmployeeDetailScreen.tsx`)
A dedicated screen showing complete employee information with attendance history.

**Features:**
- Employee profile header with avatar, name, ID, and status badge
- Contact information section (email, phone, department, role)
- Attendance statistics card (monthly attendance rate, late count, absent count)
- Recent attendance history list (last 30 days)
- Quick actions: Edit employee, Mark attendance manually, View full history
- Back navigation to employee list

### 2. Office Locations Settings (`src/pages/admin/settings/OfficeLocationsScreen.tsx`)
Manage office premises and locations.

**Features:**
- List of configured office locations with address and employee count
- Add new location button
- Edit/Delete actions for each location
- Toggle active/inactive status

### 3. Wi-Fi Networks Settings (`src/pages/admin/settings/WifiNetworksScreen.tsx`)
Configure allowed Wi-Fi networks for attendance.

**Features:**
- List of allowed Wi-Fi SSIDs with MAC address
- Add new network with SSID input
- Remove network option
- Test connectivity button

### 4. Geofencing Settings (`src/pages/admin/settings/GeofencingScreen.tsx`)
Set location boundaries for attendance.

**Features:**
- Office location selector
- Radius configuration slider (50m - 500m)
- Current configured radius display
- Save changes button

### 5. Attendance Window Settings (`src/pages/admin/settings/AttendanceWindowScreen.tsx`)
Configure attendance timing rules.

**Features:**
- Start time picker (e.g., 9:00 AM)
- End time picker (e.g., 6:00 PM)
- Days of week toggle (Mon-Fri active by default)
- Save button

### 6. Grace Period Settings (`src/pages/admin/settings/GracePeriodScreen.tsx`)
Configure late arrival tolerance.

**Features:**
- Duration selector (5, 10, 15, 20, 30 minutes)
- Explanation text
- Save button

### 7. Help Center Screen (`src/pages/admin/settings/HelpCenterScreen.tsx`)
FAQs and documentation.

**Features:**
- Accordion-style FAQ list
- Contact support button
- Email support link

### 8. Terms & Policies Screen (`src/pages/admin/settings/TermsPoliciesScreen.tsx`)
Legal information display.

**Features:**
- Terms of Service section
- Privacy Policy section
- Data Retention Policy

---

## Files to Modify

### 1. Update `src/App.tsx`
Add new routes for all settings sub-screens and employee detail:

```
/admin/employee/:id        -> AdminEmployeeDetailScreen
/admin/settings/locations  -> OfficeLocationsScreen
/admin/settings/wifi       -> WifiNetworksScreen
/admin/settings/geofencing -> GeofencingScreen
/admin/settings/window     -> AttendanceWindowScreen
/admin/settings/grace      -> GracePeriodScreen
/admin/settings/help       -> HelpCenterScreen
/admin/settings/terms      -> TermsPoliciesScreen
```

### 2. Update `src/pages/admin/AdminEmployeesScreen.tsx`
- Make employee cards clickable
- Navigate to `/admin/employee/:id` on click
- Add "Add Employee" button in header

### 3. Update `src/pages/admin/AdminReportsScreen.tsx`
**Add Export Functionality:**
- Create export modal/sheet with format options (CSV, PDF, Excel)
- Add date range picker for custom export
- Implement client-side CSV generation
- Show toast notification on successful export
- Add loading state during export

### 4. Update `src/pages/admin/AdminSettingsScreen.tsx`
**Make All Settings Functional:**
- Office Locations: Navigate to `/admin/settings/locations`
- Wi-Fi Networks: Navigate to `/admin/settings/wifi`
- Geofencing: Navigate to `/admin/settings/geofencing`
- Attendance Window: Navigate to `/admin/settings/window`
- Grace Period: Navigate to `/admin/settings/grace`
- Employee Management: Navigate to `/admin/employees`
- Admin Users: Show modal with admin list
- Help Center: Navigate to `/admin/settings/help`
- Terms & Policies: Navigate to `/admin/settings/terms`

**Add Logout Confirmation:**
- Add confirmation dialog before logout
- "Are you sure you want to sign out?"
- Cancel and Confirm buttons
- Navigate to `/admin/login` on confirm

### 5. Update `src/pages/admin/AdminDashboardScreen.tsx`
- Add logout icon button in header
- Use same logout confirmation dialog

---

## Technical Details

### Export Report Implementation
```typescript
// CSV generation function
const generateCSV = (data, timeRange) => {
  const headers = ['Date', 'Present', 'Late', 'Absent', 'Rate'];
  const rows = data.map(row => [row.date, row.present, row.late, row.absent, row.rate]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-report-${timeRange}-${Date.now()}.csv`;
  a.click();
};
```

### Logout Confirmation Dialog
Uses existing `AlertDialog` component from `@radix-ui/react-alert-dialog`:
- Trigger: Logout button click
- Title: "Sign Out"
- Description: "Are you sure you want to sign out? You'll need to log in again to access the admin portal."
- Actions: "Cancel" (secondary) and "Sign Out" (destructive)

### Settings State Management
- Each settings screen manages its own local state
- Toast notifications for save confirmations
- Form validation where applicable
- Back button navigation

---

## UI Components Used
- `Sheet` - For export options panel
- `AlertDialog` - For logout confirmation
- `Accordion` - For FAQ display in Help Center
- `Switch` - Already used for toggles
- `Slider` - For geofencing radius
- `Select` - For time pickers and dropdowns
- `Toast/Sonner` - For success/error notifications

---

## User Flow Improvements

### Employee Detail Flow
```text
Employees List -> Click Employee Card -> Employee Detail Screen
                                      -> View full attendance history
                                      -> Edit employee info
                                      -> Back to list
```

### Export Flow
```text
Reports Screen -> Click Export -> Export Sheet opens
               -> Select format (CSV/PDF)
               -> Select date range (optional)
               -> Click Download
               -> Toast: "Report downloaded successfully"
               -> Sheet closes
```

### Settings Flow
```text
Settings -> Click any setting item -> Sub-screen opens
         -> Make changes
         -> Click Save
         -> Toast: "Settings saved"
         -> Back to Settings
```

### Logout Flow
```text
Settings/Dashboard -> Click Sign Out -> Confirmation Dialog
                   -> Click Cancel -> Dialog closes
                   -> Click Sign Out -> Navigate to /admin/login
```

---

## Implementation Order
1. Create employee detail screen and add route
2. Add report export functionality with CSV download
3. Create all settings sub-screens
4. Update settings screen with navigation
5. Add logout confirmation dialog
6. Test all flows end-to-end

