# Nexus Attendo Mobile - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Android Studio (for testing on emulator)
- Physical Android device (recommended for GPS testing)

## Installation Steps

### 1. Install Expo CLI
```bash
npm install -g expo-cli eas-cli
```

### 2. Create Project
```bash
npx create-expo-app@latest nexus-attendo-mobile --template expo-template-blank-typescript
cd nexus-attendo-mobile
```

### 3. Install Dependencies
```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# Supabase & Storage
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage

# Location & Device
npm install expo-location expo-device expo-constants

# UI & Utilities
npm install react-native-paper
npm install date-fns
npm install react-native-uuid
```

### 4. Configure Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

### 5. Run Development Server
```bash
npx expo start
```

### 6. Test on Device
- Install Expo Go app on Android device
- Scan QR code from terminal
- OR press 'a' to open Android emulator

## Build APK

### Development Build
```bash
eas build --platform android --profile development
```

### Production Build
```bash
eas build --platform android --profile production
```

## Troubleshooting

### Location Permission Issues
- Ensure location services enabled on device
- Grant location permission when prompted
- For emulator: use location simulation in Android Studio

### Supabase Connection Issues
- Verify EXPO_PUBLIC_SUPABASE_URL is correct
- Verify EXPO_PUBLIC_SUPABASE_ANON_KEY is correct
- Check network connectivity

### Session Not Persisting
- Clear app data and reinstall
- Check AsyncStorage permissions
