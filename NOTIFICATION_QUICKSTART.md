# 🚀 Notification System - Quick Start Guide

## ⚡ 3-Step Setup

### Step 1: Get API Keys (5 minutes)

#### Resend (Email) - FREE
1. Go to https://resend.com
2. Sign up (no credit card needed)
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `re_`)

#### Twilio (SMS) - FREE Trial
1. Go to https://www.twilio.com/try-twilio
2. Sign up (get $15 free credit)
3. From dashboard, copy:
   - Account SID (starts with `AC`)
   - Auth Token
4. Get a phone number (free with trial)
5. Verify your test phone number in console

### Step 2: Configure Environment (1 minute)

Add to your `.env` file:

```env
RESEND_API_KEY=re_your_key_here
TWILIO_ACCOUNT_SID=ACyour_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
TEST_EMAIL=your-email@example.com
TEST_PHONE=+919999999999
```

### Step 3: Test (30 seconds)

```bash
npm run test:notification
```

**Expected:** ✅ Email and SMS sent successfully!

---

## 📱 Quick Usage

```typescript
import { notificationService } from '@server';

// Send notification
await notificationService.sendBulkNotifications(
  [{ name: 'HR', email: 'hr@company.com', phone: '+919876543210' }],
  {
    date: '2026-02-13',
    slotNumber: 1,
    slotTime: '10:10 AM',
    presentCount: 45,
    lateCount: 5,
    totalCount: 50,
    attendanceRate: 90,
  }
);
```

---

## 📧 What You Get

### SMS (68 characters)
```
Slot 1 (10:10 AM): 45 present, 5 late, 50 total. Rate: 90%. 13-Feb
```

### Email
Beautiful HTML email with:
- Purple gradient header
- Color-coded statistics
- Large attendance rate badge
- Professional design

---

## 💡 Key Features

- ✅ Auto-retry after 5 minutes if failed
- ✅ Email failures don't block SMS
- ✅ SMS failures don't block email
- ✅ No hardcoded credentials
- ✅ Comprehensive logging

---

## 💰 Cost

- **Emails:** FREE (3,000/month)
- **SMS:** ~$0.01 each
- **Total:** ~$2/month for typical usage

---

## 📚 Full Documentation

- **Setup Guide:** `NOTIFICATION_IMPLEMENTATION.md`
- **Samples:** `NOTIFICATION_SAMPLES.md`
- **Output Report:** `NOTIFICATION_OUTPUT.md`

---

## 🆘 Troubleshooting

**Email not sending?**
- Check `RESEND_API_KEY` is correct
- Verify Resend account is active

**SMS not sending?**
- Check all Twilio credentials
- Verify phone number format: `+919876543210`
- For trial: verify recipient in Twilio console

**Need help?**
- Check console logs for detailed errors
- Review API dashboards (Resend/Twilio)

---

## ✅ You're Ready!

Run the test and start sending notifications! 🎉

```bash
npm run test:notification
```
