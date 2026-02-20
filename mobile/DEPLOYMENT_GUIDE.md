# Deployment Guide - Build APK

## 🎯 Overview

This guide covers building the Android APK for distribution.

## 📋 Prerequisites

- Expo account (free)
- EAS CLI installed
- Tested app on device
- All features working

## 🚀 Step-by-Step Deployment

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

### Step 3: Configure EAS Build

```bash
cd mobile
eas build:configure
```

This creates `eas.json` configuration file.

### Step 4: Update eas.json

The file should look like this:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
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
  }
}
```

### Step 5: Build Development APK

```bash
eas build --platform android --profile development
```

This will:
- Upload your code to Expo servers
- Build the APK
- Provide download link

**Time**: ~10-15 minutes

### Step 6: Build Production APK

```bash
eas build --platform android --profile production
```

**Time**: ~10-15 minutes

### Step 7: Download APK

Once build completes:
1. Click the download link in terminal
2. OR visit: https://expo.dev/accounts/[your-account]/projects/nexus-attendo-mobile/builds
3. Download the APK file

### Step 8: Install on Device

#### Method 1: Direct Install
1. Transfer APK to device
2. Open APK file
3. Allow "Install from unknown sources"
4. Install app

#### Method 2: Share Link
1. Get shareable link from Expo dashboard
2. Open link on device
3. Download and install

## 📱 Distribution Options

### Option 1: Internal Testing
- Share APK file directly
- Good for team testing
- No Play Store needed

### Option 2: Play Store (Internal Testing)
```bash
eas build --platform android --profile production
eas submit --platform android
```

### Option 3: Play Store (Production)
Requires:
- Google Play Developer account ($25 one-time)
- App listing details
- Privacy policy
- Screenshots

## 🔧 Build Profiles Explained

### Development Build
- Includes debugging tools
- Larger file size
- For testing only

### Preview Build
- Optimized build
- Smaller size
- For internal distribution

### Production Build
- Fully optimized
- Smallest size
- For Play Store or final distribution

## 📝 App Signing

### Automatic Signing (Recommended)
Expo handles signing automatically.

### Manual Signing
If you need custom keystore:

```bash
eas build --platform android --profile production --local
```

## 🎨 App Icon & Splash Screen

Update in `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

Icon requirements:
- icon.png: 1024x1024px
- adaptive-icon.png: 1024x1024px
- splash.png: 1284x2778px

## 🔒 Environment Variables in Production

For production builds, set secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
```

## 📊 Build Status

Check build status:
```bash
eas build:list
```

View specific build:
```bash
eas build:view [build-id]
```

## 🐛 Troubleshooting

### Build Failed
- Check error logs in Expo dashboard
- Verify all dependencies installed
- Check app.json configuration

### APK Won't Install
- Enable "Install from unknown sources"
- Check Android version compatibility
- Verify APK not corrupted

### App Crashes on Launch
- Check logs: `adb logcat`
- Verify environment variables
- Test on emulator first

## 📱 Version Management

Update version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

For each release:
- Increment `version` (1.0.0 → 1.0.1)
- Increment `versionCode` (1 → 2)

## 🎯 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] App icon added
- [ ] Splash screen added
- [ ] Version numbers updated
- [ ] Tested on physical device
- [ ] Performance acceptable
- [ ] No memory leaks

## 📦 Distribution Checklist

- [ ] APK built successfully
- [ ] APK tested on device
- [ ] All features working
- [ ] No crashes
- [ ] Acceptable performance
- [ ] Ready for distribution

## 🚀 Quick Commands Reference

```bash
# Login
eas login

# Configure
eas build:configure

# Build development
eas build --platform android --profile development

# Build production
eas build --platform android --profile production

# Check builds
eas build:list

# Submit to Play Store
eas submit --platform android
```

## 📞 Support

For build issues:
- Expo docs: https://docs.expo.dev/build/introduction/
- Expo forums: https://forums.expo.dev/
- Check build logs in dashboard

## 🎉 Success!

Once APK is built and tested:
1. Distribute to team
2. Collect feedback
3. Iterate and improve
4. Deploy updates as needed

---

**Next**: Monitor app performance and user feedback
