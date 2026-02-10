# Nexon Attendance - Architecture Documentation

## 📐 Project Structure

This project follows a **strict separation** between frontend and backend code.

```
nexon-attendance/
├── src/                          # FRONTEND ONLY
│   ├── components/               # React UI components
│   ├── pages/                    # Route pages
│   ├── hooks/                    # React hooks (can import from server/)
│   ├── lib/                      # Frontend utilities
│   └── main.tsx                  # App entry point
│
├── server/                       # BACKEND ONLY
│   ├── supabase/
│   │   └── client.ts            # Supabase client configuration
│   ├── services/
│   │   ├── auth.service.ts      # Authentication operations
│   │   └── profile.service.ts   # Profile management
│   ├── types/
│   │   ├── database.ts          # Database type definitions
│   │   ├── profile.ts           # User profile types
│   │   └── auth.ts              # Authentication types
│   ├── utils/
│   │   ├── session.ts           # Session utilities
│   │   └── status.ts            # Status & role utilities
│   ├── index.ts                 # Central exports
│   └── README.md                # Backend documentation
│
├── .env                          # Environment variables
├── package.json                  # Dependencies
└── vite.config.ts               # Build configuration
```

---

## 🎯 Architecture Principles

### 1. Separation of Concerns
- **Frontend (`src/`)**: UI components, pages, routing, styling
- **Backend (`server/`)**: Data access, business logic, authentication

### 2. Import Rules
- ✅ Frontend CAN import from `server/` using `@server/*`
- ❌ Backend CANNOT import from `src/`
- ✅ Backend modules import from other backend modules

### 3. Type Safety
- All backend code is fully typed with TypeScript
- Database types auto-generated from Supabase schema
- Shared types exported from `server/types/`

### 4. Environment Configuration
- All secrets in `.env` file
- No hardcoded credentials
- Environment variables validated at runtime

---

## 🔌 How Frontend Connects to Backend

### Import Pattern

```typescript
// In any frontend file (src/)
import { authService, profileService, canAccessApp } from '@server';
import type { UserProfile, UserStatus } from '@server';
```

### Example: Login Flow

```typescript
// src/pages/LoginScreen.tsx
import { authService, profileService } from '@server';

async function handleLogin(email: string, password: string) {
  // 1. Authenticate with backend
  const { user, error } = await authService.login(email, password);
  
  if (error) {
    console.error('Login failed:', error);
    return;
  }
  
  // 2. Fetch user profile
  const { profile } = await profileService.getProfile(user.id);
  
  // 3. Check status and redirect
  if (profile?.status === 'active') {
    navigate('/dashboard');
  } else if (profile?.status === 'pending') {
    navigate('/registration-pending');
  }
}
```

---

## 🗄️ Backend Services

### Authentication Service (`server/services/auth.service.ts`)

```typescript
import { authService } from '@server';

// Login
const { user, session, error } = await authService.login(email, password);

// Logout
await authService.logout();

// Get current session
const { session } = await authService.getSession();

// Get current user
const { user } = await authService.getCurrentUser();

// Listen to auth changes
authService.onAuthStateChange((session) => {
  console.log('Auth state changed:', session);
});
```

### Profile Service (`server/services/profile.service.ts`)

```typescript
import { profileService } from '@server';

// Get profile by user ID
const { profile, error } = await profileService.getProfile(userId);

// Get profile by email
const { profile, error } = await profileService.getProfileByEmail(email);

// Access profile data
if (profile) {
  console.log(profile.role);              // 'employee' | 'admin'
  console.log(profile.status);            // 'pending' | 'active' | 'rejected' | 'blocked'
  console.log(profile.office_location);   // string | null
}
```

---

## 🛠️ Backend Utilities

### Status Utilities (`server/utils/status.ts`)

```typescript
import { canAccessApp, isPending, isAdmin } from '@server';

// Check if user can access app (status === 'active')
if (canAccessApp(profile)) {
  // Grant access
}

// Check if user is pending approval
if (isPending(profile)) {
  // Show pending screen
}

// Check if user is admin
if (isAdmin(profile)) {
  // Show admin features
}

// Get display text
import { getStatusText, getRoleText } from '@server';
console.log(getStatusText('pending')); // "Pending Approval"
console.log(getRoleText('admin'));     // "Administrator"
```

### Session Utilities (`server/utils/session.ts`)

```typescript
import { isSessionValid, getUserIdFromSession } from '@server';

// Check if session is valid
if (isSessionValid(session)) {
  // Session is active
}

// Extract user ID from session
const userId = getUserIdFromSession(session);
```

---

## 🔐 Security Model

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Row Level Security (RLS)
- Users can only read their own profile
- Admins can read all profiles
- All database access goes through Supabase RLS policies

### Authentication Flow
1. User submits credentials
2. Supabase Auth validates credentials
3. Session token issued
4. Profile fetched with RLS enforcement
5. Frontend receives user + profile data

---

## 📊 Data Flow

```
User Action (Frontend)
    ↓
React Component
    ↓
useAuth Hook / Direct Import
    ↓
Backend Service (server/)
    ↓
Supabase Client
    ↓
Supabase Database (with RLS)
    ↓
Response back to Frontend
    ↓
UI Update
```

---

## 🚀 Development Workflow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Import Backend Services
```typescript
import { authService, profileService } from '@server';
```

### 3. Use in Components
```typescript
function MyComponent() {
  const handleAction = async () => {
    const result = await authService.login(email, password);
    // Handle result
  };
}
```

---

## 📦 Build Configuration

### TypeScript Paths (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@server/*": ["./server/*"]
    }
  }
}
```

### Vite Aliases (`vite.config.ts`)
```typescript
{
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@server": path.resolve(__dirname, "./server"),
    },
  },
}
```

---

## ✅ Phase 1 Status

### Implemented
- ✅ Backend folder structure (`server/`)
- ✅ Supabase client configuration
- ✅ Authentication service
- ✅ Profile service
- ✅ Status utilities
- ✅ Session utilities
- ✅ Type definitions
- ✅ Frontend-backend integration

### Not Implemented (Future Phases)
- ❌ Attendance marking
- ❌ Admin workflows
- ❌ Reports
- ❌ Notifications
- ❌ Geofencing
- ❌ WiFi validation

---

## 🔜 Future Phases

### Phase 2: Attendance & Admin
- Attendance marking service
- Admin approval workflows
- Employee management

### Phase 3: Validation & Reports
- Geofencing validation
- WiFi network detection
- Attendance reports
- Export functionality

---

## 📚 Documentation

- **Backend**: `server/README.md`
- **Quick Start**: `QUICKSTART.md`
- **Setup Guide**: `BACKEND_SETUP.md`
- **Phase 1 Summary**: `PHASE1_SUMMARY.md`

---

**Architecture Status**: ✅ Clean Separation Achieved  
**Last Updated**: February 10, 2026
