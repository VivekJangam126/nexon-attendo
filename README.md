# Nexus Attendo

Employee Attendance Management System for Nexus Pvt Ltd

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase Database

Run `COMPLETE_DATABASE_SETUP.sql` in your Supabase SQL Editor to create all tables and policies.

### 3. Create Admin Account

**Via Supabase Dashboard:**
1. Go to: **Authentication > Users > Add User**
2. Fill in:
   - Email: `admin@nexus.com`
   - Password: `nexus@123`
   - Auto Confirm User: ✅ **CHECK THIS**
3. Click "Create User"

**Then run this SQL:**
```sql
-- Create admin profile
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
SELECT id, 'admin@nexus.com', 'Admin', 'admin', 'active', NOW(), NOW()
FROM auth.users WHERE email = 'admin@nexus.com';
```

### 4. Configure Environment Variables

Create `.env.production`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Configure Office Location (Optional)

For GPS verification, update office coordinates:
```sql
UPDATE offices 
SET 
  name = 'Nexus Pvt Ltd - Head Office',
  latitude = YOUR_LATITUDE,
  longitude = YOUR_LONGITUDE,
  radius_meters = 100,
  is_active = true
WHERE id = (SELECT id FROM offices LIMIT 1);
```

### 6. Setup Notifications (Optional)

**Set Supabase Edge Function Secrets:**
```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
supabase secrets set TWILIO_PHONE_NUMBER=your_twilio_number
```

**Deploy Edge Functions:**
```bash
supabase functions deploy send-notification
supabase functions deploy notification-cron
```

**Add Notification Contacts:**
```sql
INSERT INTO notification_contacts (contact_type, contact_value, is_active)
VALUES 
  ('email', 'admin@nexus.com', true),
  ('sms', '+1234567890', true);
```

**Enable Automatic Notifications (Cron Job):**
```sql
-- Create cron job for automatic notifications
SELECT cron.schedule(
  'attendance-notifications',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/notification-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### 7. Deploy to Vercel

```bash
npm run build
vercel --prod
```

---

## 🔑 Default Login

- **URL**: `/admin/login`
- **Email**: `admin@nexus.com`
- **Password**: `nexus@123`

---

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Vercel
- **Notifications**: Resend (Email) + Twilio (SMS)

---

## ⚙️ Features

### Employee Features
- Mark attendance with GPS + WiFi verification
- View attendance history and reports
- Profile management
- Check attendance rules

### Admin Features
- Employee management (add, edit, approve)
- Attendance reports and analytics
- System settings configuration
- Notification management (manual + automatic)
- Pending registration approvals

### Attendance Verification
- **Strict Mode ON**: GPS + WiFi verification required
- **Strict Mode OFF**: Direct attendance marking (no location checks)

---

## 📁 Project Structure

```
nexus-attendo/
├── src/                          # Frontend React app
│   ├── components/               # UI components
│   ├── pages/                    # Page components
│   │   ├── admin/                # Admin pages
│   │   └── ...                   # Employee pages
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utilities
├── server/                       # Backend services
│   ├── services/                 # Business logic
│   ├── types/                    # TypeScript types
│   └── supabase/                 # Supabase client
├── supabase/functions/           # Edge Functions
│   ├── send-notification/        # Notification sender
│   └── notification-cron/        # Automatic notifications
├── api/                          # Vercel serverless functions
├── COMPLETE_DATABASE_SETUP.sql   # Database schema
└── README.md                     # This file
```

---

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

---

## 🗄️ Database Schema

### Main Tables
- `profiles` - User profiles (admin/employee)
- `attendance` - Attendance records
- `attendance_settings` - System settings (window, strict mode)
- `offices` - Office locations (GPS coordinates)
- `office_networks` - WiFi networks for verification
- `employee_requests` - Registration requests
- `notification_contacts` - Email/SMS contacts
- `notification_history` - Notification logs

### Row Level Security (RLS)
All tables have RLS policies:
- Employees can only see their own data
- Admins can see all data
- Authentication required for all operations

---

## 🎯 Admin Settings

### Strict Mode
Toggle in: **Admin Settings > System > Strict Mode**
- **Enabled**: GPS + WiFi verification required for attendance
- **Disabled**: Direct attendance marking (no location checks)

### Attendance Window
Configure in: **Admin Settings > Attendance Window**
- Set working hours (e.g., 9:00 AM - 6:00 PM)
- Select working days (Mon-Sun)

### Notifications
Configure in: **Admin Settings > Notifications**
- Add email/SMS contacts
- Set notification slots (hourly)
- Send manual alerts
- View notification history

---

## 🐛 Troubleshooting

### Can't login as admin
Run this SQL to reset admin:
```sql
-- Clear references
UPDATE attendance_settings SET updated_by = NULL;
DELETE FROM profiles;

-- Delete auth users via Dashboard > Authentication > Users

-- Create new admin via Dashboard > Add User
-- Then run:
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
SELECT id, 'admin@nexus.com', 'Admin', 'admin', 'active', NOW(), NOW()
FROM auth.users WHERE email = 'admin@nexus.com';
```

### "No active attendance window"
```sql
INSERT INTO attendance_settings (setting_name, start_time, end_time, is_active, strict_mode)
VALUES ('default_attendance_window', '09:00:00', '18:00:00', true, true);
```

### GPS verification failing
1. Check office location is set in `offices` table
2. Verify GPS coordinates are correct
3. Adjust `radius_meters` (e.g., 100m)
4. Or disable strict mode for testing

### WiFi verification failing
1. Check `office_networks` table has WiFi entries
2. Verify IP ranges match your network
3. Or disable strict mode for testing

### Notifications not sending
1. Verify Edge Function secrets are set
2. Check `notification_contacts` table has entries
3. Test with manual notification first
4. Check notification history for errors

---

## 📱 Mobile-First Design

The app is designed mobile-first with:
- Responsive layouts for all screen sizes
- Touch-friendly interactions
- Bottom navigation for mobile
- Sidebar navigation for desktop
- Progressive Web App (PWA) ready

---

## 🔐 Security

- Row Level Security (RLS) on all tables
- JWT-based authentication via Supabase Auth
- Role-based access control (admin/employee)
- Secure password hashing
- HTTPS only in production

---

## 📄 License

© 2024 Nexus Pvt Ltd. All rights reserved.

---

## 📞 Support

For issues or questions, contact: admin@nexus.com
