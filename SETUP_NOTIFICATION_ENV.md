# 🔑 Setup Notification Environment Variables

## Quick Fix for "Missing API key" Error

The error you saw means the environment variables aren't configured yet. Follow these steps:

---

## Step 1: Open Your `.env` File

The `.env` file is in the root of your project.

---

## Step 2: Add These Lines

Add the following to your `.env` file:

```env
# Notification Services
RESEND_API_KEY=your_resend_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Optional: Test Recipients
TEST_EMAIL=your-email@example.com
TEST_PHONE=+919999999999
```

---

## Step 3: Get Your API Keys

### For Resend (Email) - FREE

1. Go to https://resend.com
2. Click "Sign Up" (no credit card needed)
3. After signup, go to "API Keys" in the dashboard
4. Click "Create API Key"
5. Give it a name (e.g., "Attendance System")
6. Copy the key (starts with `re_`)
7. Paste it in `.env` as `RESEND_API_KEY=re_your_key_here`

**Free Tier:** 3,000 emails/month, 100 emails/day

### For Twilio (SMS) - FREE Trial

1. Go to https://www.twilio.com/try-twilio
2. Sign up (you get $15 free credit)
3. After signup, you'll see your dashboard
4. Copy these three values:
   - **Account SID** (starts with `AC`) → `TWILIO_ACCOUNT_SID`
   - **Auth Token** (click to reveal) → `TWILIO_AUTH_TOKEN`
5. Get a phone number:
   - Click "Get a Twilio phone number"
   - Accept the suggested number
   - Copy it → `TWILIO_PHONE_NUMBER` (format: +1234567890)
6. **Important for Trial:** Verify your test phone number:
   - Go to "Phone Numbers" → "Verified Caller IDs"
   - Click "Add a new number"
   - Enter your phone number (+919999999999)
   - Verify with the code sent to you

**Trial Credit:** $15 (enough for ~1,500 SMS to India)

---

## Step 4: Example `.env` File

Here's what your `.env` should look like (with your actual values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Notification Services
RESEND_API_KEY=re_abc123def456ghi789
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+12345678901

# Optional: Test Recipients
TEST_EMAIL=yourname@gmail.com
TEST_PHONE=+919876543210
```

---

## Step 5: Test Again

After adding the environment variables, run:

```bash
npm run test:notification
```

You should see:
```
✅ Email sent successfully!
✅ SMS sent successfully!
```

---

## Troubleshooting

### Still Getting "Missing API key" Error?

1. **Check the `.env` file location:** It should be in the root folder (same level as `package.json`)
2. **Check for typos:** Variable names must match exactly (case-sensitive)
3. **No quotes needed:** Just `RESEND_API_KEY=re_123`, not `RESEND_API_KEY="re_123"`
4. **Restart the test:** After editing `.env`, run the test command again

### Resend API Key Not Working?

- Make sure you copied the entire key (starts with `re_`)
- Check if the key is active in Resend dashboard
- Try creating a new API key

### Twilio Not Working?

- Verify all three credentials are correct (SID, Token, Phone Number)
- Phone number must include country code: `+12345678901`
- For trial accounts: recipient number must be verified in Twilio console
- Check your Twilio account balance

### SMS to India Not Working?

- Make sure the phone number format is: `+919876543210` (no spaces or dashes)
- For trial accounts: verify the Indian number in Twilio console first
- Check if your Twilio account has India SMS enabled

---

## Quick Test Without Full Setup

If you just want to test the SMS content generation (no API calls):

```typescript
import { notificationService } from '@server';

const smsContent = notificationService.generateSMSContent({
  date: '2026-02-13',
  slotNumber: 1,
  slotTime: '10:10 AM',
  presentCount: 45,
  lateCount: 5,
  totalCount: 50,
  attendanceRate: 90,
});

console.log(smsContent);
// Output: Slot 1 (10:10 AM): 45 present, 5 late, 50 total. Rate: 90%. 13-Feb
```

---

## Need Help?

1. Check that `.env` file exists in the root folder
2. Verify all environment variables are set correctly
3. Make sure there are no extra spaces or quotes
4. Restart your terminal/test after editing `.env`

---

**Once configured, the notification system will work perfectly!** 🎉
