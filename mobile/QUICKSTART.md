# 🚀 Quick Start Guide

Get the Nexus Attendo mobile app running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Android device or emulator
- Supabase project credentials

## Step 1: Install Dependencies

```bash
cd mobile
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Start Development Server

```bash
npx expo start
```

## Step 4: Run on Device

### Option A: Physical Device
1. Install "Expo Go" from Play Store
2. Scan QR code from terminal
3. App will load automatically

### Option B: Android Emulator
1. Press `a` in terminal
2. Emulator will launch automatically

## Step 5: Test Login

Use existing employee credentials from your web app.

## 🎯 What to Test

1. **Login** - Use employee credentials
2. **Dashboard** - View today's status
3. **Mark Attendance** - Grant location permission
4. **History** - View past records
5. **Profile** - Check user info
6. **Logout** - Test session cleanup

## ⚠️ Common Issues

### "Cannot connect to Supabase"
- Check `.env` file has correct credentials
- Verify network connectivity
- Ensure Supabase project is active

### "Location permission denied"
- Go to device Settings → Apps → Expo Go → Permissions
- Enable Location permission
- Restart app

### "Attendance marking fails"
- Ensure you're testing during attendance window
- Check if attendance already marked today
- Verify GPS signal (test outdoors)

## 📱 Device Requirements

- Android 10+ recommended
- GPS/Location services enabled
- Internet connection required

## 🔧 Development Tips

### View Logs
```bash
npx expo start
# Press 'j' to open debugger
```

### Clear Cache
```bash
npx expo start -c
```

### Rebuild
```bash
rm -rf node_modules
npm install
npx expo start
```

## ✅ Success Checklist

- [ ] App launches without errors
- [ ] Login screen appears
- [ ] Can login with credentials
- [ ] Dashboard loads
- [ ] Can navigate between screens
- [ ] Location permission works
- [ ] Can mark attendance
- [ ] History displays records

## 🎉 You're Ready!

The app is now running. Start testing the attendance flow.

For detailed documentation, see:
- `README.md` - Project overview
- `SETUP.md` - Detailed setup
- `IMPLEMENTATION_GUIDE.md` - Technical details

## 📞 Need Help?

Check console logs for detailed error messages. Most issues are related to:
1. Environment configuration
2. Network connectivity
3. Permissions
4. Backend availability
