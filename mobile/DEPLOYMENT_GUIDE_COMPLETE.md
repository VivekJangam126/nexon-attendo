# Complete Android App Deployment Guide

## Prerequisites

Before building the APK, ensure you have:

1. ✅ Expo CLI installed
2. ✅ EAS CLI installed
3. ✅ Expo account created
4. ✅ All features tested and working

## Step 1: Install EAS CLI

If not already installed:

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
cd mobile
eas login
```

Enter your Expo account credentials.

## Step 3: Configure EAS Build

Create `eas.json` in the mobile folder:

```bash
eas build:configure
```

This creates `mobile/eas.json`. Update it with this configuration:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 4: Update app.json

Make sure `mobile/app.json` has correct configuration:

```json
{
  "expo": {
    "name": "Nexus Attendo",
    "slug": "nexus-attendo-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "android": {
      "package": "com.nexus.attendo",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

## Step 5: Create App Icons (Optional but Recommended)

If you don't have custom icons, you can use default ones or create them:

### Quick Icon Setup

Create a simple icon using any image editor or use online tools:
- Icon size: 1024x1024 px
- Adaptive icon: 1024x1024 px
- Splash screen: 1284x2778 px

Or skip this step and Expo will use default icons.

## Step 6: Build APK for Testing (Preview Build)

```bash
cd mobile
eas build --platform android --profile preview
```

This will:
1. Upload your code to Expo servers
2. Build an APK
3. Provide a download link

**Build time**: 5-15 minutes

## Step 7: Build APK for Production

```bash
cd mobile
eas build --platform android --profile production
```

## Step 8: Download and Install APK

After build completes:

1. You'll get a download link in the terminal
2. Download the APK file
3. Transfer to your Android device
4. Install the APK (enable "Install from Unknown Sources" if needed)

## Alternative: Build Locally (Faster for Testing)

If you want to build locally without EAS:

```bash
cd mobile
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Step 9: Test the APK

Install on a real Android device and test:

1. ✅ Login works
2. ✅ Dashboard loads with correct data
3. ✅ Mark attendance works
4. ✅ History shows records
5. ✅ Profile displays correctly
6. ✅ Change password works
7. ✅ Logout works
8. ✅ GPS validation (if enabled)

## Step 10: Distribute to Users

### Option A: Direct Distribution
- Share the APK file directly
- Users install manually

### Option B: Internal Testing (Google Play)
1. Create Google Play Console account
2. Create app listing
3. Upload APK to Internal Testing track
4. Share testing link with users

### Option C: Production Release (Google Play)
1. Complete app listing
2. Upload production APK
3. Submit for review
4. Publish to Play Store

## Troubleshooting

### Build Fails

**Error: "No Expo account"**
```bash
eas login
```

**Error: "Invalid credentials"**
- Check `mobile/.env` has correct Supabase URL and key
- Ensure no syntax errors in code

**Error: "Build timeout"**
- Try again, sometimes Expo servers are busy
- Check your internet connection

### APK Won't Install

**"App not installed"**
- Enable "Install from Unknown Sources" in Android settings
- Make sure you have enough storage space
- Uninstall any previous version first

### App Crashes on Launch

**Check logs:**
```bash
adb logcat | grep -i "nexus"
```

**Common issues:**
- Missing environment variables in `.env`
- Wrong Supabase URL/key
- Network connectivity issues

## Production Checklist

Before releasing to users:

- [ ] Test on multiple Android devices
- [ ] Test on different Android versions (8.0+)
- [ ] Verify all features work
- [ ] Check GPS validation with correct office coordinates
- [ ] Enable strict mode in production
- [ ] Test with real user accounts
- [ ] Verify attendance marking and history
- [ ] Test password change functionality
- [ ] Check logout and re-login
- [ ] Verify auto-checkout at 6 PM
- [ ] Test with poor network conditions
- [ ] Check app permissions are requested properly

## Environment Variables

Make sure `mobile/.env` has production values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## App Versioning

When releasing updates:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2
   }
   ```

2. Build new APK:
   ```bash
   eas build --platform android --profile production
   ```

3. Distribute to users

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel

# Check account info
eas whoami

# Logout
eas logout
```

## Support

If you encounter issues:

1. Check Expo documentation: https://docs.expo.dev/
2. Check EAS Build docs: https://docs.expo.dev/build/introduction/
3. Expo Discord: https://chat.expo.dev/
4. Stack Overflow: Tag with `expo` and `react-native`

## Next Steps After Deployment

1. **Monitor Usage**
   - Check Supabase dashboard for API usage
   - Monitor error logs
   - Track user feedback

2. **Plan Updates**
   - Bug fixes
   - New features
   - Performance improvements

3. **User Training**
   - Share user manual: `docs/EMPLOYEE_USER_MANUAL.md`
   - Conduct training sessions
   - Create video tutorials

4. **Maintenance**
   - Regular database backups
   - Monitor server performance
   - Update dependencies periodically

## Cost Considerations

- **Expo EAS Build**: Free tier includes limited builds/month
- **Google Play Store**: $25 one-time registration fee
- **Supabase**: Free tier or paid plan based on usage
- **Vercel**: Free tier for web app

## Security Recommendations

1. **Enable GPS validation** in production
2. **Use strong passwords** for admin accounts
3. **Regular security audits**
4. **Keep dependencies updated**
5. **Monitor for suspicious activity**
6. **Implement rate limiting** (already done)
7. **Regular database backups**

---

## Quick Start Commands

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
cd mobile
eas login

# 3. Configure
eas build:configure

# 4. Build APK
eas build --platform android --profile preview

# 5. Download and install APK on device
```

That's it! Your app is ready for deployment! 🚀
