# Nexus Attendo - Administrator User Manual

**Version:** 1.0.0  
**Last Updated:** February 2026  
**For:** System Administrators and HR Managers

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Employee Management](#employee-management)
5. [Attendance Management](#attendance-management)
6. [Reports & Analytics](#reports--analytics)
7. [System Settings](#system-settings)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

Nexus Attendo is a comprehensive attendance management system designed to streamline employee attendance tracking with GPS-based verification, automated notifications, and detailed reporting capabilities.

### Key Features

- **Real-time Dashboard** - Monitor attendance status at a glance
- **GPS Geofencing** - Ensure employees check in from office premises
- **Automated Check-out** - Automatic check-out at 6:00 PM daily
- **Smart Notifications** - SMS and email alerts for attendance events
- **Comprehensive Reports** - Detailed attendance analytics and exports
- **Employee Management** - Approve, activate, deactivate, or remove employees

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to your Nexus Attendo URL
2. Click on **Admin Login**
3. Enter your admin credentials
4. You'll be redirected to the Admin Dashboard

### First-Time Setup

After logging in for the first time:

1. **Configure Office Locations** (Settings → Office Locations)
2. **Set Attendance Window** (Settings → Attendance Window)
3. **Configure Grace Period** (Settings → Grace Period)
4. **Setup Notifications** (Settings → Notifications)
5. **Review Pending Approvals** (Pending Approvals)

---

## Dashboard Overview

The Admin Dashboard provides a real-time overview of attendance status.

### Dashboard Metrics

- **Total Employees** - Number of active employees
- **Present Today** - Employees who checked in on time
- **Late Today** - Employees who checked in after grace period
- **Absent Today** - Employees who haven't checked in
- **Attendance Rate** - Percentage of employees present

### Quick Actions

- **View All Employees** - Navigate to employee list
- **Pending Approvals** - Review registration requests
- **Generate Reports** - Access reporting module
- **Settings** - Configure system parameters

### Auto-Refresh

The dashboard automatically refreshes every 10 seconds to show the latest attendance data.

---

## Employee Management

### Viewing Employees

**Navigation:** Dashboard → Employees

The employee list shows:
- Employee name and email
- Current status (Active/Pending/Blocked)
- Office location
- Registration date

**Filters:**
- **All** - Show all employees
- **Active** - Currently active employees
- **Awaiting** - Pending approval or blocked

**Search:** Use the search bar to find employees by name or email

### Approving New Employees

**Navigation:** Dashboard → Pending Approvals

1. Review the employee's registration details
2. Click **Approve** to activate the employee
3. Click **Reject** to deny the registration
   - Provide a rejection reason
   - Employee will be notified via email

### Managing Employee Status

**Activate/Deactivate:**
1. Go to Settings → Employee Management
2. Find the employee
3. Click **Activate** or **Deactivate**
   - Deactivated employees cannot check in
   - Their data is preserved

**Delete Employee:**
1. Go to Settings → Employee Management
2. Find the employee
3. Click **Delete**
4. Confirm deletion
   - This permanently removes the employee
   - All attendance records are deleted
   - This action cannot be undone

### Adding Employees Manually

**Navigation:** Employees → Add Employee

1. Click **Add Employee** button
2. Fill in employee details:
   - Full Name
   - Email Address
   - Office Location
3. Click **Create**
4. Employee receives registration email

---

## Attendance Management

### Viewing Today's Attendance

**Navigation:** Dashboard

The dashboard shows real-time attendance status:
- **Present** - Checked in within grace period
- **Late** - Checked in after grace period
- **Absent** - Not checked in

### Attendance Rules

**Check-in Window:**
- Configured in Settings → Attendance Window
- Default: 9:30 AM - 6:00 PM IST

**Grace Period:**
- Configured in Settings → Grace Period
- Default: 15 minutes
- Employees checking in within grace period are marked "Present"
- After grace period: marked "Late"

**GPS Validation:**
- Can be enabled/disabled in Settings
- When enabled: employees must be within office radius
- When disabled: GPS is captured but not validated

**Automatic Check-out:**
- All employees are automatically checked out at 6:00 PM IST
- No manual check-out required
- Ensures complete attendance records

### Yesterday Check-out Validation

The system prevents employees from checking in if their previous day's attendance wasn't checked out. This ensures data integrity.

**To resolve:**
1. Go to Reports → Attendance History
2. Find the employee's record
3. Contact system administrator to manually update if needed

---

## Reports & Analytics

### Overview Tab

**Navigation:** Reports → Overview

Displays:
- Attendance rate trends
- Present/Late/Absent breakdown
- Daily statistics
- Monthly comparison

### Attendance History

**Navigation:** Reports → Attendance History

Features:
- Date range selection
- Employee filter
- Status filter (Present/Late/Absent)
- Check-in and check-out times
- Export to Excel/PDF

### Export Reports

**Navigation:** Reports → Export

1. Select date range
2. Choose employees (All or specific)
3. Select format:
   - **Excel** - Detailed spreadsheet
   - **PDF** - Formatted report with company header
4. Click **Generate Report**
5. Download the file

**Report Contents:**
- Employee details
- Date and day
- Check-in time
- Check-out time
- Status
- Total hours (if applicable)

---

## System Settings

### Office Locations

**Navigation:** Settings → Office Locations

**Add Office:**
1. Click **Add Office**
2. Enter office details:
   - Office Name
   - Address, City, State, Country
   - GPS Coordinates (or use "Use Current Location")
   - Geofence Radius (in meters)
3. Click **Create**

**Edit Office:**
1. Click edit icon on office card
2. Update details
3. Click **Update**

**Delete Office:**
- Only possible if no employees are assigned
- Click delete icon and confirm

**Activate/Deactivate:**
- Toggle office status
- Inactive offices cannot be selected during registration

### Attendance Window

**Navigation:** Settings → Attendance Window

Configure the time window when employees can check in:
1. Set **Start Time** (e.g., 9:30 AM)
2. Set **End Time** (e.g., 6:00 PM)
3. Click **Save**

Employees can only check in during this window.

### Grace Period

**Navigation:** Settings → Grace Period

Set the late arrival tolerance:
1. Enter grace period in minutes (0-60)
2. Click **Save**

Example: With 15-minute grace period and 9:30 AM start:
- Check-in before 9:45 AM → Present
- Check-in after 9:45 AM → Late

### Geofencing

**Navigation:** Settings → Geofencing

Configure GPS radius for each office:
1. Select office from dropdown
2. Adjust radius slider (50m - 500m)
3. Click **Save**

Employees must be within this radius to check in (if GPS validation is enabled).

### GPS Validation

**Navigation:** Settings (GPS Validation toggle)

- **Enabled (Required):** GPS coordinates required and validated
- **Disabled (Optional):** GPS captured but not validated

When disabled, employees can check in from anywhere, but GPS is still recorded for audit purposes.

### Notification Settings

**Navigation:** Settings → Notifications

Configure automated notifications:

**SMS Notifications:**
- Enable/disable SMS alerts
- Configure Twilio credentials
- Set notification time

**Email Notifications:**
- Enable/disable email alerts
- Configure email settings
- Set recipients

**Notification Types:**
- Daily attendance summary
- Late arrival alerts
- Absent employee notifications

### Employee Management

**Navigation:** Settings → Employee Management

Bulk operations:
- View all employees
- Activate/Deactivate multiple employees
- Delete employees
- Export employee list

---

## Troubleshooting

### Common Issues

**Employee Cannot Check In**

Possible causes:
1. **Outside attendance window** - Check Settings → Attendance Window
2. **Outside office radius** - Check Settings → Geofencing
3. **GPS validation enabled** - Employee must be at office
4. **Previous day not checked out** - Contact administrator
5. **Account not active** - Check employee status

**Attendance Not Showing**

1. Refresh the dashboard (auto-refreshes every 10 seconds)
2. Check if employee is active
3. Verify attendance window is open
4. Check Reports → Attendance History

**Automatic Check-out Not Working**

1. Verify cron job is scheduled (contact system administrator)
2. Check Edge Function logs in Supabase
3. Ensure pg_net extension is enabled

**Reports Not Generating**

1. Check date range is valid
2. Ensure employees exist for selected period
3. Try different export format
4. Check browser console for errors

### Getting Help

**System Administrator:**
- Check Supabase logs
- Review Edge Function execution
- Verify database connectivity
- Check cron job status

**Technical Support:**
- Email: support@nexus.com
- Documentation: Check README.md
- Database: Supabase Dashboard

---

## Best Practices

### Daily Operations

1. **Morning:** Review pending approvals
2. **During Day:** Monitor dashboard for attendance
3. **Evening:** Check if all employees are checked out
4. **Weekly:** Generate attendance reports
5. **Monthly:** Review attendance trends

### Security

1. **Never share admin credentials**
2. **Regularly review employee access**
3. **Monitor for suspicious activity**
4. **Keep system updated**
5. **Backup data regularly**

### Data Management

1. **Regular exports** - Download monthly reports
2. **Archive old data** - Keep records for compliance
3. **Review inactive employees** - Clean up periodically
4. **Audit logs** - Check for anomalies

---

## Appendix

### Keyboard Shortcuts

- **Ctrl + R** - Refresh dashboard
- **Ctrl + F** - Search employees
- **Esc** - Close dialogs

### System Requirements

- **Browser:** Chrome, Firefox, Safari, Edge (latest versions)
- **Internet:** Stable connection required
- **Screen:** 1280x720 minimum resolution
- **Mobile:** Responsive design for tablets

### Glossary

- **Grace Period:** Time buffer for late arrivals
- **Geofencing:** GPS-based location verification
- **Check-in:** Employee arrival time recording
- **Check-out:** Employee departure time recording (automatic at 6 PM)
- **Attendance Rate:** Percentage of present employees

---

**© 2026 Nexus Pvt Ltd. All rights reserved.**
