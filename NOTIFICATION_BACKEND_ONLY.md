# ⚠️ IMPORTANT: Notification Service is Backend-Only

## The Error You Saw

```
Uncaught TypeError: Class extends value undefined is not a constructor or null
at twilio.js
```

This error happens because the notification service uses **Node.js-only packages** (Twilio and Resend) that cannot run in the browser.

---

## ✅ FIXED

I've removed the notification service from the main `server/index.ts` exports to prevent it from being bundled with frontend code.

---

## How to Use the Notification Service

### ✅ Correct Usage (Backend Scripts Only)

```typescript
// In backend scripts, API routes, or server-side code
import { notificationService } from './server/services/notification.service';
import type { AttendanceNotificationData } from './server/services/notification.service';

// Use the service
const result = await notificationService.sendEmailNotification(
  'hr@company.com',
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

### ❌ DO NOT DO THIS (Frontend/React Components)

```typescript
// ❌ This will cause browser errors!
import { notificationService } from '@server';

// ❌ This will also fail in React components
import { notificationService } from './server/services/notification.service';
```

---

## Where to Use Notification Service

### ✅ Safe Places:
- Backend test scripts (like `test-notification.ts`)
- Server-side API routes (if you add Express/Fastify)
- Scheduled jobs (cron jobs)
- Backend utility scripts
- Database triggers (if using Supabase Edge Functions)

### ❌ Unsafe Places:
- React components (`.tsx` files in `src/`)
- Frontend hooks
- Client-side utilities
- Anywhere that runs in the browser

---

## Why This Restriction?

1. **Twilio SDK** requires Node.js APIs (http, https, crypto) that don't exist in browsers
2. **Resend SDK** also uses Node.js-specific features
3. **Security**: API keys should never be exposed to the frontend
4. **Bundle Size**: These packages are large and would bloat your frontend bundle

---

## Future Integration

When you're ready to integrate notifications into your app, you'll need to:

1. **Create a backend API endpoint** (using Express, Fastify, or Supabase Edge Functions)
2. **Call the notification service from that endpoint**
3. **Frontend calls the API endpoint** (not the service directly)

Example architecture:
```
Frontend (React)
    ↓ HTTP Request
Backend API Endpoint
    ↓ Direct Import
Notification Service
    ↓ API Calls
Resend/Twilio
```

---

## Testing

The test script works because it runs in Node.js (not the browser):

```bash
npm run test:notification
```

This is safe because it's executed by Node.js, not loaded in the browser.

---

## Summary

- ✅ Notification service is working correctly
- ✅ It's been removed from frontend exports
- ✅ Your admin panel should load without errors now
- ✅ Use the service only in backend scripts
- ✅ Test with `npm run test:notification`

---

**The error is now fixed. Your admin panel should load normally!** 🎉
