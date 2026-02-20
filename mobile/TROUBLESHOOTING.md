# Mobile App Troubleshooting Guide

## Current Issue: App Not Loading

### Error Messages
```
ERROR: Permission Denial: registerScreenCaptureObserver requires android.permission.DETECT_SCREEN_CAPTURE
ERROR: Invariant Violation: "main" has not been registered
```

### Root Causes
1. **Expo SDK 50 Screen Capture Detection**: Expo SDK 50 tries to detect screen capture but requires a permission
2. **Module Loading Failure**: A module is crashing before `AppRegistry.registerComponent` completes

---

## Fix Applied

### 1. Block Screen Capture Permission
Added to `app.json`:
```json
"blockedPermissions": [
  "android.permission.DETECT_SCREEN_CAPTURE"
]
```

This tells Expo to NOT request this permission, preventing the error.

### 2. Lazy Loading with Error Handling
Modified `App.tsx` to:
- Lazy load heavy modules (navigation, services)
- Show loading screen during initialization
- Display error messages if initialization fails
- Prevent app crash from propagating to registration

---

## Testing Steps

### Step 1: Test Minimal App
```bash
cd mobile

# Temporarily change index.js to use minimal app
# Edit index.js: import App from './App-minimal';

npm start
# Then press 'a' for Android
```

**Expected**: Should see "✅ App Loaded Successfully!" message.

**If this fails**: React Native setup is broken. Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### Step 2: Test Module Dependencies
```bash
# Edit index.js: import App from './App-debug';

npm start
# Press 'a' for Android
```

**Expected**: Should see a list of all modules with ✅ or ❌ status.

**If any module fails**: That's the problematic dependency. Check:
- Is it installed? `npm list <package-name>`
- Is version compatible with Expo 50?
- Does it need additional configuration?

### Step 3: Test Full App
```bash
# Edit index.js: import App from './App';

npm start
# Press 'a' for Android
```

**Expected**: Should see loading screen, then navigation should load.

**If this fails**: Check the error message in the terminal. The lazy loading should now show which specific import is failing.

---

## Common Issues & Solutions

### Issue: "Metro bundler not running"
**Solution**:
```bash
# Kill any existing Metro processes
npx react-native start --reset-cache
```

### Issue: "Unable to resolve module"
**Solution**:
```bash
# Clear Metro cache
rm -rf node_modules/.cache
npm start -- --reset-cache
```

### Issue: "Android build failed"
**Solution**:
```bash
# Clear Android build cache
cd android
./gradlew clean
cd ..
npm start
```

### Issue: "Supabase connection fails"
**Solution**:
1. Check `.env` file has correct values
2. Restart Metro bundler after changing `.env`
3. Test Supabase URL in browser: `https://falbkccaqjqdbvrmdlll.supabase.co`

### Issue: "Location permission not working"
**Solution**:
1. Uninstall app from device/emulator
2. Reinstall to trigger permission prompts
3. Check Android settings → Apps → Nexus Attendo → Permissions

---

## Alternative: Downgrade Expo SDK

If the screen capture issue persists, consider downgrading to Expo SDK 49:

```bash
cd mobile

# Downgrade Expo
npm install expo@~49.0.0

# Update compatible dependencies
npx expo install --fix

# Clear cache and restart
rm -rf node_modules/.cache
npm start -- --reset-cache
```

---

## Debugging Commands

### Check Metro Bundler Logs
```bash
npm start
# Look for red error messages in terminal
```

### Check Android Logcat
```bash
# In a separate terminal
adb logcat | grep -i "nexus\|attendo\|error"
```

### Check Installed Packages
```bash
npm list expo
npm list react-native
npm list @supabase/supabase-js
```

### Verify Environment Variables
```bash
# Should show Supabase URL and key
cat .env
```

---

## Next Steps After Fix

Once the app loads successfully:

1. **Test Login Flow**
   - Try logging in with test credentials
   - Check if session persists after app restart

2. **Test Location Services**
   - Grant location permission
   - Check if GPS coordinates are captured

3. **Test Attendance Marking**
   - Try marking attendance
   - Verify data is sent to backend

4. **Run Backend Integration**
   ```bash
   # In Supabase SQL editor, run:
   # mobile/BACKEND_INTEGRATION.sql
   ```

5. **Build APK**
   ```bash
   # Follow mobile/DEPLOYMENT_GUIDE.md
   eas build --platform android
   ```

---

## Contact Points

If issues persist:
1. Check Expo documentation: https://docs.expo.dev
2. Check React Navigation docs: https://reactnavigation.org
3. Check Supabase docs: https://supabase.com/docs
4. Review error logs in terminal carefully
