# Nexus Attendo Mobile App

Production-ready Android attendance app built with Expo + TypeScript.

## 🎯 Features

- ✅ Supabase Authentication with session persistence
- ✅ GPS-based attendance marking with geofencing
- ✅ Device tracking (UUID + device info)
- ✅ Attendance history with filters
- ✅ Strict mode support (GPS optional/mandatory)
- ✅ Rate limiting handling
- ✅ Offline-first architecture
- ✅ IST timezone support

## 📁 Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client with AsyncStorage
│   ├── types/
│   │   ├── auth.ts              # Auth & profile types
│   │   ├── attendance.ts        # Attendance types
│   │   └── office.ts            # Office types
│   ├── services/
│   │   ├── auth.service.ts      # Login, logout, session
│   │   ├── attendance.service.ts # Mark attendance, history
│   │   ├── device.service.ts    # Device ID & info
│   │   └── location.service.ts  # GPS permissions & location
│   ├── utils/
│   │   ├── storage.ts           # AsyncStorage helpers
│   │   ├── errorHandler.ts      # Error code mapping
│   │   └── dateFormatter.ts     # Date/time utilities
│   ├── screens/                 # (Next phase)
│   ├── navigation/              # (Next phase)
│   └── components/              # (Next phase)
├── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

## 🚀 Setup

See [SETUP.md](./SETUP.md) for detailed installation instructions.

Quick start:
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npx expo start
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Permissions

The app requires:
- `ACCESS_FINE_LOCATION` - For GPS-based attendance
- `ACCESS_COARSE_LOCATION` - Fallback location

## 📱 Core Services

### Auth Service
- Login with email/password
- Auto-restore session on app restart
- Logout with data cleanup

### Attendance Service
- Mark attendance with GPS validation
- Get today's attendance status
- Fetch attendance history
- Check strict mode setting

### Location Service
- Request location permissions
- Get high-accuracy GPS coordinates
- Validate accuracy threshold (< 150m)

### Device Service
- Generate persistent device UUID
- Build user agent string
- Collect device information

## 🔒 Security

- ✅ No hardcoded credentials
- ✅ Environment variables for sensitive data
- ✅ AsyncStorage for session persistence
- ✅ Backend validates all requests
- ✅ Device tracking for audit trail

## 📊 Implementation Status

### ✅ Phase 1: Complete
- Project setup
- Type definitions
- Core services (auth, attendance, location, device)
- Utilities (storage, error handling, date formatting)

### 🚧 Phase 2: In Progress
- Screen components
- Navigation setup
- UI components

### ⏳ Phase 3: Pending
- Testing
- Build configuration
- Deployment

## 🎨 Next Steps

1. Create screen components (Login, Dashboard, Mark Attendance, History, Profile)
2. Setup navigation (Auth stack, Employee stack)
3. Build UI components (Button, Card, StatusBadge, etc.)
4. Implement error handling UI
5. Add loading states
6. Test on physical device
7. Build APK

## 📝 Notes

- Backend API is already deployed on Vercel
- No backend modifications needed
- App uses existing Supabase database
- All validation happens on backend
- Frontend only displays results

## 🐛 Troubleshooting

### Location not working
- Enable location services on device
- Grant location permission
- Test in open area for better GPS signal

### Session not persisting
- Check AsyncStorage permissions
- Verify Supabase configuration
- Clear app data and reinstall

### Attendance marking fails
- Check network connectivity
- Verify you're within office radius
- Ensure attendance window is open
- Check if already marked today

## 📞 Support

For issues or questions, contact the development team.
