# Quick Testing Steps

## Current Status
✅ Fixed: Screen capture permission error (blocked in app.json)
✅ Fixed: App.tsx now uses lazy loading with error handling
✅ Created: Multiple test versions (minimal, debug, full)

## What to Do Next

### Option 1: Test Minimal App (Recommended First)
This tests if basic React Native works:

1. **Edit `index.js`** - Change line 6:
   ```javascript
   import App from './App-minimal';
   ```

2. **Start Metro**:
   ```bash
   npm start
   ```

3. **Run on Android**:
   - Press `a` in terminal, OR
   - Scan QR code with Expo Go app

4. **Expected Result**:
   - Should see blue screen with "✅ App Loaded Successfully!"
   - If this works, React Native setup is fine

### Option 2: Test Module Dependencies
This identifies which module is failing:

1. **Edit `index.js`** - Change line 6:
   ```javascript
   import App from './App-debug';
   ```

2. **Start Metro**:
   ```bash
   npm start
   ```

3. **Run on Android**:
   - Press `a` in terminal

4. **Expected Result**:
   - Should see list of modules with ✅ or ❌
   - Any ❌ indicates the problematic module

### Option 3: Test Full App
This tests the complete app with lazy loading:

1. **Edit `index.js`** - Change line 6:
   ```javascript
   import App from './App';
   ```

2. **Start Metro**:
   ```bash
   npm start
   ```

3. **Run on Android**:
   - Press `a` in terminal

4. **Expected Result**:
   - Should see "Loading Nexus Attendo..." briefly
   - Then should load login screen
   - If error occurs, it will show error message instead of crashing

---

## If Still Getting Errors

### Clear Everything and Restart
```bash
# Stop Metro (Ctrl+C)

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo

# Restart with clean cache
npm start -- --reset-cache
```

### Check Android Device/Emulator
```bash
# List connected devices
adb devices

# Should show at least one device
```

### Reinstall Dependencies
```bash
# Only if nothing else works
rm -rf node_modules
npm install
npm start
```

---

## Understanding the Fixes

### 1. Blocked Screen Capture Permission
**File**: `app.json`
```json
"blockedPermissions": [
  "android.permission.DETECT_SCREEN_CAPTURE"
]
```
This prevents Expo SDK 50 from requesting a permission that causes crashes.

### 2. Lazy Loading
**File**: `App.tsx`
- Modules are now imported dynamically using `import()`
- Shows loading screen during import
- Shows error message if import fails
- Prevents crash from reaching app registration

### 3. Test Versions
- **App-minimal.tsx**: Just React Native, no dependencies
- **App-debug.tsx**: Tests each dependency individually
- **App.tsx**: Full app with error handling

---

## Next Steps After App Loads

1. ✅ Verify login screen appears
2. ✅ Test login with credentials
3. ✅ Test location permission request
4. ✅ Test attendance marking
5. ✅ Run backend SQL (BACKEND_INTEGRATION.sql)
6. ✅ Build APK (follow DEPLOYMENT_GUIDE.md)

---

## Quick Commands Reference

```bash
# Start development server
npm start

# Start with clean cache
npm start -- --reset-cache

# Run on Android
npm run android

# Check logs
adb logcat | grep -i nexus

# List devices
adb devices

# Clear Metro cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules && npm install
```
