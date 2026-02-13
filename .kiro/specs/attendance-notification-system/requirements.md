# Attendance Notification System - Requirements

## Overview
A notification system that sends SMS and email alerts to HR contacts showing employee attendance counts at configurable time slots throughout the day.

## User Stories

### US-1: Configure Notification Time Slots
**As an** admin  
**I want to** configure 3 time slots for attendance notifications  
**So that** HR can receive attendance updates at specific times during the day

**Acceptance Criteria:**
- AC-1.1: Admin can set 3 configurable time slots (e.g., 10:10 AM, 10:30 AM, 6:00 PM)
- AC-1.2: Each time slot can be enabled/disabled independently
- AC-1.3: Time slots are stored in the database and persist across sessions
- AC-1.4: Time slots are displayed in 12-hour format with AM/PM
- AC-1.5: System validates that time slots are in chronological order

### US-2: Manage HR Contact Information
**As an** admin  
**I want to** add and manage HR contact details (phone numbers and emails)  
**So that** notifications are sent to the right people

**Acceptance Criteria:**
- AC-2.1: Admin can add multiple HR contacts with name, phone number, and email
- AC-2.2: Admin can enable/disable individual contacts without deleting them
- AC-2.3: Phone numbers are validated for correct format
- AC-2.4: Email addresses are validated for correct format
- AC-2.5: Admin can edit existing contact information
- AC-2.6: Admin can delete contacts with confirmation

### US-3: Receive Attendance Count Notifications
**As an** HR contact  
**I want to** receive SMS and email notifications with attendance counts  
**So that** I can track employee attendance throughout the day

**Acceptance Criteria:**
- AC-3.1: Slot 1 notification shows cumulative count from attendance window start to Slot 1 time
- AC-3.2: Slot 2 notification shows incremental count from Slot 1 to Slot 2 time
- AC-3.3: Slot 3 notification shows incremental count from Slot 2 to Slot 3 time (or end of day)
- AC-3.4: Each notification includes: date, time slot, present count, late count, total count
- AC-3.5: Notifications are sent via both SMS and email simultaneously
- AC-3.6: Notifications include a summary line (e.g., "85% attendance rate")

### US-4: Manual Notification Trigger
**As an** admin  
**I want to** manually trigger attendance notifications  
**So that** I can send updates on-demand when needed

**Acceptance Criteria:**
- AC-4.1: Admin can trigger notifications from the Reports page
- AC-4.2: Manual trigger shows current attendance counts before sending
- AC-4.3: Admin can select which time slot format to use for the manual notification
- AC-4.4: System confirms successful sending with toast notification
- AC-4.5: Manual notifications are logged in notification history

### US-5: View Notification History
**As an** admin  
**I want to** view a history of sent notifications  
**So that** I can audit and verify notification delivery

**Acceptance Criteria:**
- AC-5.1: History shows date, time, slot number, recipient count, and delivery status
- AC-5.2: History can be filtered by date range
- AC-5.3: History shows success/failure status for each notification
- AC-5.4: Failed notifications display error messages
- AC-5.5: History is paginated (20 records per page)

### US-6: Automatic Notification Scheduling
**As an** admin  
**I want to** enable automatic notifications at configured time slots  
**So that** HR receives updates without manual intervention

**Acceptance Criteria:**
- AC-6.1: Admin can enable/disable automatic notifications globally
- AC-6.2: When enabled, notifications are sent automatically at configured times
- AC-6.3: Automatic notifications only run on working days (Monday-Friday)
- AC-6.4: System handles timezone correctly (IST)
- AC-6.5: Failed automatic notifications are retried once after 5 minutes

## Business Rules

### BR-1: Time Slot Calculation
- Slot 1: Count all attendance records from attendance window start time to Slot 1 time
- Slot 2: Count attendance records from Slot 1 time to Slot 2 time (incremental)
- Slot 3: Count attendance records from Slot 2 time to Slot 3 time or 6:00 PM (incremental)

### BR-2: Notification Content
- SMS messages must be concise (under 160 characters)
- Email messages can include detailed breakdown with formatting
- Both formats must include: date, slot, present count, late count, total

### BR-3: Delivery Rules
- Notifications are sent only to enabled HR contacts
- If all SMS fail, system still attempts email delivery
- If all email fail, system still attempts SMS delivery
- Delivery failures are logged for admin review

### BR-4: Security & Privacy
- Only admins can configure notification settings
- Only admins can view notification history
- HR contact information is encrypted in database
- Notification content does not include employee names (only counts)

## Technical Constraints

### TC-1: SMS Provider
- Must integrate with a reliable SMS gateway (e.g., Twilio, AWS SNS)
- Must handle rate limiting and retry logic
- Must support Indian phone numbers (+91)

### TC-2: Email Provider
- Must integrate with email service (e.g., SendGrid, AWS SES, SMTP)
- Must support HTML email templates
- Must handle bounce and delivery tracking

### TC-3: Scheduling
- Must use a reliable job scheduler (e.g., node-cron, pg_cron)
- Must handle server restarts gracefully
- Must prevent duplicate notifications

### TC-4: Database
- Must store notification settings in Supabase
- Must store notification history with retention policy (90 days)
- Must use RLS policies for security

## Open Questions

### Q-1: SMS/Email Provider Choice
**Question:** Which SMS and email providers should we integrate with?  
**Options:**
- Twilio (SMS) + SendGrid (Email)
- AWS SNS (SMS) + AWS SES (Email)
- Other providers

**Decision needed from:** User

### Q-2: Number of HR Contacts
**Question:** What is the expected maximum number of HR contacts?  
**Impact:** Affects rate limiting and batch sending logic

**Decision needed from:** User

### Q-3: Automatic vs Manual Trigger
**Question:** Should notifications be automatic by default, or manual only?  
**Current assumption:** Both options available, admin chooses

**Decision needed from:** User

### Q-4: Notification Retry Logic
**Question:** How many times should failed notifications be retried?  
**Current assumption:** 1 retry after 5 minutes

**Decision needed from:** User

### Q-5: Working Days Configuration
**Question:** Should working days be configurable, or fixed to Monday-Friday?  
**Current assumption:** Fixed to Monday-Friday

**Decision needed from:** User

## Dependencies

### External Dependencies
- SMS gateway API (Twilio/AWS SNS)
- Email service API (SendGrid/AWS SES)
- Job scheduler library (node-cron)

### Internal Dependencies
- Existing attendance system (attendance table)
- Existing attendance window settings (attendance_settings table)
- Admin authentication and authorization

## Success Metrics

### SM-1: Delivery Success Rate
- Target: 95% of notifications delivered successfully
- Measured by: notification_history table delivery_status

### SM-2: Notification Timeliness
- Target: Notifications sent within 2 minutes of scheduled time
- Measured by: difference between scheduled_time and sent_time

### SM-3: Admin Adoption
- Target: 80% of admins configure at least one notification slot
- Measured by: notification_settings table usage

## Out of Scope

The following features are explicitly out of scope for this initial implementation:

- OS-1: Push notifications to mobile apps
- OS-2: WhatsApp notifications
- OS-3: Slack/Teams integration
- OS-4: Custom notification templates per HR contact
- OS-5: Attendance anomaly detection and alerts
- OS-6: Individual employee attendance notifications
- OS-7: Multi-language support for notifications
