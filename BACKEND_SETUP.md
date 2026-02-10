# Nexon Attendance - Backend Foundation (Phase 1)

## Overview
This document describes the backend foundation setup for the Nexon Attendance system using Supabase.

## Architecture

### Technology Stack
- **Backend**: Supabase (PostgreSQL + Auth)
- **Frontend**: React + TypeScript
- **State Management**: React Context + TanStack Query

### Database Schema Required

Before using this application, you need to set up the following table in your Supabase project:

#### `profiles` table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
  office_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings:
- Go to Project Settings > API
- Copy the Project URL and anon/public key

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

## Project Structure

```
src/
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── services/
│   ├── authService.ts       # Authentication operations
│   └── profileService.ts    # Profile management
├── hooks/
│   └── useAuth.tsx          # Auth context and hook
└── utils/
    └── authHelpers.ts       # Reusable auth utilities
```

## Core Components

### 1. Supabase Client (`src/lib/supabase.ts`)
- Initializes Supabase client with environment variables
- Exports TypeScript types for database entities
- Validates required environment variables

### 2. Authentication Service (`src/services/authService.ts`)
Provides methods for:
- `login(email, password)` - User login
- `logout()` - User logout
- `getSession()` - Get current session
- `getCurrentUser()` - Get current user
- `onAuthStateChange(callback)` - Listen to auth changes

### 3. Profile Service (`src/services/profileService.ts`)
Provides methods for:
- `getProfile(userId)` - Fetch user profile by ID
- `getProfileByEmail(email)` - Fetch profile by email
- `canAccessApp(profile)` - Check if user can access app
- `isPending(profile)` - Check if user is pending approval
- `isBlocked(profile)` - Check if user is blocked/rejected
- `isAdmin(profile)` - Check if user is admin

### 4. Auth Hook (`src/hooks/useAuth.tsx`)
React context providing:
- `user` - Current authenticated user
- `session` - Current session
- `profile` - User profile from database
- `loading` - Loading state
- `login(email, password)` - Login function
- `logout()` - Logout function
- `refreshProfile()` - Refresh profile data

### 5. Auth Helpers (`src/utils/authHelpers.ts`)
Utility functions for:
- `isAuthenticated(profile)` - Check authentication
- `getStatusText(profile)` - Get status display text
- `getRoleText(profile)` - Get role display text
- `getRedirectPath(profile)` - Determine redirect based on status
- `canAccessEmployeeFeatures(profile)` - Check employee access
- `canAccessAdminFeatures(profile)` - Check admin access

## User Status Flow

### Status Types
1. **pending** - User registered but awaiting admin approval
   - Can login
   - App access restricted
   - Redirected to pending screen

2. **active** - User approved and active
   - Full app access
   - Can mark attendance (future phase)

3. **rejected** - Registration rejected by admin
   - Login blocked
   - Redirected to blocked screen

4. **blocked** - Account blocked by admin
   - Login blocked
   - Redirected to blocked screen

## Usage Example

```tsx
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';

function MyComponent() {
  const { user, profile, loading, login, logout } = useAuth();

  const handleLogin = async () => {
    const { error } = await login('user@example.com', 'password');
    if (error) {
      console.error('Login failed:', error);
      return;
    }
    
    // Profile is automatically fetched after login
    if (profile) {
      console.log('User role:', profile.role);
      console.log('User status:', profile.status);
      console.log('Office location:', profile.office_location);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {profile?.full_name}</p>
          <p>Status: {profile?.status}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## Security Notes

- ✅ No secrets hardcoded
- ✅ Environment variables used for configuration
- ✅ Row Level Security enabled on profiles table
- ✅ Authentication handled by Supabase Auth
- ✅ Profile access controlled by RLS policies

## What's NOT Included (Future Phases)

❌ Attendance marking logic
❌ Admin approval workflows
❌ Report generation
❌ Geofencing/WiFi validation
❌ Attendance history queries

## Validation Checklist

Before moving to Phase 2, verify:

- ✅ Supabase project created
- ✅ Environment variables configured
- ✅ `profiles` table created with RLS
- ✅ Login functionality works
- ✅ Profile fetched after login
- ✅ User status visible in code
- ✅ No attendance logic implemented
- ✅ No admin approval logic implemented

## Next Steps (Phase 2)

Phase 2 will implement:
- Attendance marking with validation
- Admin approval workflows
- Employee management
- Basic reporting

---

**Phase 1 Status**: ✅ Complete
**Last Updated**: February 10, 2026
