# Nexon Time Keeper - Attendance Management System

A comprehensive attendance management system with web and mobile applications, built for modern workplaces.

## 🚀 Features

### Employee Features
- **Attendance Marking**
  - GPS-based check-in/check-out
  - Real-time location verification
  - Automatic late detection with grace period
  - Live work duration tracking

- **Dashboard**
  - Today's attendance status
  - Work duration timer
  - Attendance window display
  - Quick check-in/check-out

- **History & Reports**
  - Attendance history with filters
  - Work hours tracking
  - Monthly statistics
  - Status indicators (Present/Late/Absent)

- **Profile Management**
  - View profile information
  - Change password
  - Office location details

### Admin Features
- **Employee Management**
  - Add/edit/delete employees
  - Approve/reject registrations
  - Activate/deactivate accounts
  - Bulk operations

- **Attendance Configuration**
  - Flexible attendance window (24-hour support)
  - Grace period settings (unlimited duration)
  - Checkout time configuration
  - Auto-checkout toggle

- **Office Management**
  - Multiple office locations
  - GPS geofencing with custom radius
  - Office-specific settings

- **Reports & Analytics**
  - Attendance reports with filters
  - Export to Excel/PDF
  - Email report delivery
  - Real-time statistics

- **Settings**
  - GPS validation toggle
  - Notification settings (SMS/Email)
  - Employee management
  - System configuration

### System Features
- **Security**
  - Role-based access control (Admin/Employee)
  - Device fingerprinting
  - Rate limiting
  - Audit logging

- **Automation**
  - Auto-checkout cron job
  - Notification triggers
  - Email reports scheduling

- **Multi-Platform**
  - Web application (React)
  - Mobile application (React Native/Expo)
  - Responsive design

## 🛠️ Tech Stack

### Frontend
- **Web**: React 18 + TypeScript + Vite
- **Mobile**: React Native + Expo
- **UI**: TailwindCSS + shadcn/ui
- **State**: React Query
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Deno (Supabase Functions)

### Infrastructure
- **Hosting**: Vercel (Web), EAS (Mobile)
- **Database**: Supabase
- **Cron Jobs**: Supabase pg_cron
- **Notifications**: SMS/Email APIs

## 📦 Project Structure

```
nexon-time-keeper/
├── src/                      # Web application source
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   └── utils/              # Helper functions
├── server/                  # Backend services
│   ├── api/                # API endpoints
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   └── utils/              # Server utilities
├── mobile/                  # Mobile application
│   ├── src/
│   │   ├── components/     # Mobile components
│   │   ├── screens/        # Screen components
│   │   ├── services/       # API services
│   │   └── navigation/     # Navigation setup
│   └── app.json            # Expo configuration
├── supabase/               # Supabase configuration
│   └── functions/          # Edge functions
├── docs/                   # Documentation
│   ├── ADMIN_USER_MANUAL.md
│   └── EMPLOYEE_USER_MANUAL.md
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nexon-time-keeper
```

2. **Install dependencies**
```bash
# Web app
npm install

# Mobile app
cd mobile
npm install
cd ..
```

3. **Environment Setup**

Create `.env` file in root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `mobile/.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**

Run the database migrations in Supabase SQL Editor:
- Set up tables and relationships
- Configure Row Level Security (RLS)
- Insert default data

5. **Start Development**

```bash
# Web app
npm run dev

# Mobile app
cd mobile
npm start
```

## 📱 Mobile App Setup

### Development Build
```bash
cd mobile
npx expo start
```

### Production Build
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

See `mobile/DEPLOYMENT_GUIDE_COMPLETE.md` for detailed instructions.

## 🔧 Configuration

### Attendance Settings
- **Attendance Window**: Configure check-in time range (up to 22 hours)
- **Grace Period**: Set late arrival tolerance (unlimited duration)
- **Checkout Time**: Set default auto-checkout time
- **GPS Validation**: Toggle location verification

### Office Settings
- **Geofencing**: Set GPS radius for each office (default: 100m)
- **Multiple Offices**: Support for multiple office locations
- **Office-specific Rules**: Different settings per office

### Notification Settings
- **SMS Notifications**: Configure SMS alerts
- **Email Notifications**: Set up email notifications
- **Triggers**: Attendance marked, late arrival, etc.

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles and roles
- `offices` - Office locations and settings
- `attendance` - Attendance records
- `attendance_settings` - System configuration
- `notifications` - Notification logs
- `audit_logs` - System audit trail

### Views
- `daily_work_summary` - Aggregated work hours

## 🔐 Security

### Authentication
- Email/password authentication
- Session management
- Device fingerprinting

### Authorization
- Role-based access control (RBAC)
- Row Level Security (RLS)
- API rate limiting

### Data Protection
- Encrypted connections (HTTPS)
- Secure password storage
- PII data protection

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📚 Documentation

- [Admin User Manual](docs/ADMIN_USER_MANUAL.md)
- [Employee User Manual](docs/EMPLOYEE_USER_MANUAL.md)
- [Mobile Deployment Guide](mobile/DEPLOYMENT_GUIDE_COMPLETE.md)

## 🚀 Deployment

### Web Application
Deployed on Vercel with automatic deployments from main branch.

```bash
# Manual deployment
vercel --prod
```

### Mobile Application
Built and distributed via Expo Application Services (EAS).

```bash
# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Supabase Functions
```bash
# Deploy edge functions
supabase functions deploy auto-checkout-cron
supabase functions deploy notification-cron
```

## 🔄 Cron Jobs

### Auto-Checkout
Runs daily to automatically check out employees who haven't manually checked out.
- Reads default time from settings
- Respects auto-checkout toggle
- Logs all operations

### Notifications
Sends scheduled notifications based on configured triggers.

## 🐛 Troubleshooting

### Common Issues

**GPS not working**
- Ensure location permissions are granted
- Check GPS is enabled on device
- Verify office coordinates are correct

**Attendance not marking**
- Check attendance window is open
- Verify GPS is within office radius
- Ensure user is active and has office assigned

**Times showing incorrectly**
- All times stored in UTC
- Converted to IST for display
- Check timezone settings

## 📝 License

Proprietary - All rights reserved

## 👥 Support

For support and queries:
- Email: support@nexon.com
- Documentation: See `/docs` folder

## 🎯 Roadmap

### Phase 3 (Planned)
- Leave Management System
- Holiday & Weekend Management
- Employee Performance Dashboard
- Advanced Analytics

## 📈 Version History

### v2.0.0 (Current)
- ✅ Checkout functionality
- ✅ Enhanced grace period
- ✅ 24-hour attendance window
- ✅ Improved admin controls
- ✅ Timezone handling fixes

### v1.0.0
- ✅ Basic attendance marking
- ✅ GPS validation
- ✅ Admin dashboard
- ✅ Employee management
- ✅ Reports and exports

## 🤝 Contributing

This is a private project. For internal contributions:
1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Wait for review

## 📞 Contact

**Nexon Technologies**
- Website: www.nexon.com
- Email: info@nexon.com
- Phone: +91-XXXXXXXXXX

---

Built with ❤️ by Nexon Technologies
