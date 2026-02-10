# Nexon Attendance - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** > **API**
3. Copy your **Project URL** and **anon/public key**

### Step 3: Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Table

In your Supabase SQL Editor, run:

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### Step 5: Create Test User

In Supabase **Authentication** > **Users**, create a test user:
- Email: `test@nexon.com`
- Password: `Test123!`

Then in SQL Editor, add their profile:

```sql
INSERT INTO profiles (id, email, full_name, role, status, office_location)
VALUES (
  'user-id-from-auth-table',
  'test@nexon.com',
  'Test User',
  'employee',
  'active',
  'Main Office'
);
```

### Step 6: Run the App

```bash
npm run dev
```

Visit `http://localhost:5173` and login with your test credentials!

## 🎯 Using the Auth System

### In Any Component

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, profile, login, logout } = useAuth();

  // Check if user is logged in
  if (!user) return <div>Please login</div>;

  // Access profile data
  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      <p>Role: {profile?.role}</p>
      <p>Status: {profile?.status}</p>
      <p>Office: {profile?.office_location}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Login Example

```tsx
const { login } = useAuth();

const handleLogin = async (email: string, password: string) => {
  const { error } = await login(email, password);
  
  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    // Profile is automatically loaded
    // Redirect to dashboard
  }
};
```

## 📚 Key Files

- `src/lib/supabase.ts` - Supabase client
- `src/services/authService.ts` - Auth operations
- `src/services/profileService.ts` - Profile operations
- `src/hooks/useAuth.tsx` - React auth hook
- `src/utils/authHelpers.ts` - Helper functions

## 🔍 User Status Types

| Status | Description | Can Login? | Can Access App? |
|--------|-------------|------------|-----------------|
| `pending` | Awaiting approval | ✅ Yes | ❌ No |
| `active` | Approved & active | ✅ Yes | ✅ Yes |
| `rejected` | Registration rejected | ❌ No | ❌ No |
| `blocked` | Account blocked | ❌ No | ❌ No |

## 🛠️ Troubleshooting

### "Missing Supabase environment variables"
- Check your `.env` file exists
- Verify variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after creating `.env`

### "Profile not found"
- Ensure user exists in `profiles` table
- Check user ID matches between `auth.users` and `profiles`
- Verify RLS policies are set up correctly

### Login fails
- Check credentials are correct
- Verify user exists in Supabase Auth
- Check browser console for errors

## 📖 Full Documentation

- `BACKEND_SETUP.md` - Complete setup guide
- `PHASE1_SUMMARY.md` - Implementation details

## ✅ You're Ready!

The backend foundation is complete. You can now:
- ✅ Login users
- ✅ Access user profiles
- ✅ Check user roles and status
- ✅ Build protected routes

**Next**: Implement attendance marking and admin features in Phase 2!
