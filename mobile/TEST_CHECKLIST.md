# ✅ Mobile App Testing Checklist

## 🎯 Your Mission
Test if the app loads successfully after the fixes.

---

## 📋 Pre-Test Setup

### ✅ Step 1: Verify Environment
```bash
cd mobile
```

Check these files exist:
- [ ] `App.tsx` (updated with lazy loading)
- [ ] `App-minimal.tsx` (minimal test version)
- [ ] `App-debug.tsx` (debug test version)
- [ ] `app.json` (has blockedPermissions)
- [ ] `package.json` (has test scripts)

### ✅ Step 2: Ensure Device Ready
- [ ] Android device/emulator is running
- [ ] USB debugging enabled (if physical device)
- [ ] Run `adb devices` - shows your device

---

## 🧪 Test Sequence

### Test 1: Minimal App (5 minutes)

**Purpose**: Verify React Native works

**Steps**:
```bash
npm run test:minimal
npm start
```
Then press `a` for Android

**Expected Result**:
- [ ] Blue screen appears
- [ ] Text says "✅ App Loaded Successfully!"
- [ ] No crash or error

**If Failed**:
- [ ] Check terminal for errors
- [ ] Try: `npm start -- --clear`
- [ ] Try: `rm -rf node_modules/.cache && npm start`

---

### Test 2: Debug App (5 minutes)

**Purpose**: Check all dependencies load

**Steps**:
```bash
npm run test:debug
npm start
```
Then press `a` for Android

**Expected Result**:
- [ ] Dark screen with module list appears
- [ ] All modules show ✅ (green checkmark)
- [ ] No ❌ (red X) marks

**If Any Module Shows ❌**:
- [ ] Note which module failed
- [ ] Check if installed: `npm list <module-name>`
- [ ] Try reinstalling: `npm install <module-name>`

---

### Test 3: Full App (10 minutes)

**Purpose**: Test complete application

**Steps**:
```bash
npm run test:full
npm start
```
Then press `a` for Android

**Expected Result**:
- [ ] "Loading Nexus Attendo..." appears briefly
- [ ] Splash screen appears
- [ ] Login screen appears
- [ ] No crash or "main has not been registered" error

**If Failed**:
- [ ] Check what error message is shown
- [ ] Screenshot the error
- [ ] Check terminal for detailed error

---

## 🎉 Success Criteria

### ✅ All Tests Pass If:
- [ ] Minimal app shows success message
- [ ] Debug app shows all ✅ marks
- [ ] Full app shows login screen
- [ ] No crashes or blank screens
- [ ] No "main has not been registered" error
- [ ] No "DETECT_SCREEN_CAPTURE" error

---

## 🔍 Common Issues & Quick Fixes

### Issue: Metro bundler not starting
**Fix**:
```bash
npm start -- --clear
```

### Issue: "Unable to resolve module"
**Fix**:
```bash
rm -rf node_modules/.cache
npm start
```

### Issue: Device not detected
**Fix**:
```bash
adb devices
# If empty, reconnect device or restart emulator
```

### Issue: App shows error message
**Fix**:
- Read the error message carefully
- Check TROUBLESHOOTING.md for specific error
- Report the exact error message

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Minimal app success screen
- [ ] Debug app module list
- [ ] Full app login screen
- [ ] Any error messages (if they occur)

---

## 📝 Test Results Template

Copy and fill this out:

```
TEST RESULTS
============

Date: [DATE]
Device: [Android version, device model]

Test 1 - Minimal App:
Status: [ ] Pass [ ] Fail
Notes: 

Test 2 - Debug App:
Status: [ ] Pass [ ] Fail
Failed Modules (if any):
Notes:

Test 3 - Full App:
Status: [ ] Pass [ ] Fail
Error Message (if any):
Notes:

Overall Status: [ ] All Pass [ ] Some Failed

Next Steps:
```

---

## 🚀 After All Tests Pass

### Next Phase: Functional Testing

1. **Test Login**:
   - [ ] Enter valid credentials
   - [ ] Click login button
   - [ ] Should navigate to dashboard

2. **Test Location Permission**:
   - [ ] App requests location permission
   - [ ] Grant permission
   - [ ] App can access GPS

3. **Test Attendance Marking**:
   - [ ] Navigate to Mark Attendance
   - [ ] Click mark attendance button
   - [ ] Should capture location
   - [ ] Should send to backend

4. **Test History**:
   - [ ] Navigate to History
   - [ ] Should show past attendance
   - [ ] Should show correct dates

5. **Test Profile**:
   - [ ] Navigate to Profile
   - [ ] Should show user info
   - [ ] Logout should work

---

## 📚 Reference Documents

If you need help:
- **Quick Start**: `QUICK_START.md`
- **Detailed Steps**: `TEST_STEPS.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Architecture**: `ARCHITECTURE.md`
- **Fix Summary**: `FIXES_APPLIED.md`

---

## ⏱️ Estimated Time

- **Minimal Test**: 5 minutes
- **Debug Test**: 5 minutes
- **Full Test**: 10 minutes
- **Total**: ~20 minutes

---

## 🎯 Your Goal Today

**Minimum**: Get Test 1 (Minimal) passing
**Good**: Get Tests 1 & 2 passing
**Excellent**: Get all 3 tests passing
**Perfect**: All tests pass + login works

---

## 📞 If You Get Stuck

1. Check the error message carefully
2. Look in TROUBLESHOOTING.md for that error
3. Try the "Clear Everything" fix:
   ```bash
   rm -rf node_modules/.cache
   rm -rf .expo
   npm start -- --clear
   ```
4. Report the specific error with screenshot

---

## ✅ Final Checklist

Before reporting results:
- [ ] Ran all 3 tests
- [ ] Documented results
- [ ] Took screenshots
- [ ] Tried troubleshooting if failed
- [ ] Ready to report findings

---

**Good luck! 🚀**

Start with: `npm run test:minimal && npm start`
