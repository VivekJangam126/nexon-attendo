# Notification Samples - Quick Reference

## SMS Content Examples

### Slot 1 (Cumulative from start)
```
Slot 1 (10:10 AM): 45 present, 5 late, 50 total. Rate: 90%. 13-Feb
```
**Length:** 68 characters ✅

### Slot 2 (Incremental)
```
Slot 2 (10:30 AM): 12 present, 3 late, 15 total. Rate: 80%. 13-Feb
```
**Length:** 68 characters ✅

### Slot 3 (Incremental to end of day)
```
Slot 3 (06:00 PM): 8 present, 2 late, 10 total. Rate: 80%. 13-Feb
```
**Length:** 67 characters ✅

## Email Template Preview

### Header Section
- **Background:** Purple gradient (from #667eea to #764ba2)
- **Title:** 📊 Attendance Report
- **Subtitle:** Full date (e.g., "Friday, February 13, 2026")

### Slot Information Card
- **Background:** Light gray with blue left border
- **Content:** "Time Slot 1" + "10:10 AM"

### Statistics Grid

#### Present Card (Green)
- **Background:** Light green (#f0fdf4)
- **Number:** Large, bold, green (#16a34a)
- **Label:** "PRESENT" in uppercase

#### Late Card (Yellow)
- **Background:** Light yellow (#fef3c7)
- **Number:** Large, bold, orange (#d97706)
- **Label:** "LATE" in uppercase

### Total Section
- **Background:** Light gray
- **Total Count:** Very large number (36px)
- **Attendance Rate Badge:**
  - Green if ≥90%
  - Orange if 75-89%
  - Red if <75%

### Footer
- **Text:** "This is an automated notification from the Attendance Management System."
- **Style:** Small, gray text, centered

## Test Payload

```typescript
{
  date: '2026-02-13',
  slotNumber: 1,
  slotTime: '10:10 AM',
  presentCount: 45,
  lateCount: 5,
  totalCount: 50,
  attendanceRate: 90
}
```

## API Response Examples

### Successful Email
```typescript
{
  success: true,
  messageId: 'abc123-def456-ghi789'
}
```

### Successful SMS
```typescript
{
  success: true,
  messageId: 'SM1234567890abcdef1234567890abcdef'
}
```

### Failed Notification
```typescript
{
  success: false,
  error: 'Invalid API key'
}
```

## Bulk Notification Response

```typescript
{
  emailResults: [
    { recipient: 'hr1@company.com', result: { success: true, messageId: 'abc123' } },
    { recipient: 'hr2@company.com', result: { success: true, messageId: 'def456' } }
  ],
  smsResults: [
    { recipient: '+919876543210', result: { success: true, messageId: 'SM123' } },
    { recipient: '+919876543211', result: { success: true, messageId: 'SM456' } }
  ]
}
```

## Environment Variables Template

```env
# Resend API (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Twilio API (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Test Recipients (Optional)
TEST_EMAIL=your-email@example.com
TEST_PHONE=+919999999999
```

## Quick Test Command

```bash
npm run test:notification
```

## Integration Example

```typescript
import { notificationService } from '@server';

// Get attendance data for current slot
const attendanceData = {
  date: new Date().toISOString().split('T')[0],
  slotNumber: 1,
  slotTime: '10:10 AM',
  presentCount: 45,
  lateCount: 5,
  totalCount: 50,
  attendanceRate: 90,
};

// Send to HR contacts
const recipients = [
  { name: 'HR Manager', email: 'hr@company.com', phone: '+919876543210' }
];

const results = await notificationService.sendBulkNotifications(
  recipients,
  attendanceData
);

console.log('Notifications sent:', results);
```

---

**Quick Links:**
- Full Documentation: `NOTIFICATION_IMPLEMENTATION.md`
- Test Script: `test-notification.ts`
- Service Code: `server/services/notification.service.ts`
