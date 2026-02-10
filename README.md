# Nexon Attendance System

A corporate attendance tracking system built for Nexon Pvt Ltd using React, TypeScript, and Supabase.

## 🏗️ Architecture

This project follows a **strict separation** between frontend and backend:

```
├── src/          # Frontend (React, UI, pages)
├── server/       # Backend (Supabase, services, business logic)
└── .env          # Configuration
```

**Key Principle**: Backend code lives in `server/`, frontend in `src/`. No mixing.

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete details.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Setup Database

Run `COMPLETE_DATABASE_SETUP.sql` in Supabase SQL Editor.

### 4. Start Development
```bash
npm run dev
```

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Project structure and design
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Complete backend setup guide
- **[server/README.md](server/README.md)** - Backend documentation

## ✅ Implemented Features

### Phase 1: Backend Foundation
- ✅ Supabase integration
- ✅ Authentication service layer
- ✅ Profile management
- ✅ Account status awareness (pending/active/rejected/blocked)
- ✅ Type-safe database operations

### Phase 2: Registration & Approval
- ✅ Employee registration service (creates pending users)
- ✅ Login restriction enforcement (pending/rejected users blocked)
- ✅ Admin approval service (approve/reject requests)
- ✅ Multi-office awareness (office selection and assignment)
- ✅ RLS policies (employee/admin access control)

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: React Context, TanStack Query
- **Routing**: React Router v6

## 🎯 Project Structure

```
nexon-attendance/
├── src/                          # FRONTEND
│   ├── components/               # React components
│   ├── pages/                    # Route pages
│   ├── hooks/                    # React hooks
│   └── main.tsx                  # Entry point
│
├── server/                       # BACKEND
│   ├── supabase/                 # Supabase client
│   ├── services/                 # Auth & profile services
│   ├── types/                    # Type definitions
│   ├── utils/                    # Utilities
│   └── index.ts                  # Exports
│
├── .env                          # Configuration
└── package.json                  # Dependencies
```

## 🔐 Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';
import { authService, profileService } from '@server';

function MyComponent() {
  const { user, profile, login, logout } = useAuth();
  
  // Or use services directly
  const handleLogin = async () => {
    const { user, error } = await authService.login(email, password);
    if (!error) {
      const { profile } = await profileService.getProfile(user.id);
      console.log(profile?.role);      // 'employee' | 'admin'
      console.log(profile?.status);    // 'pending' | 'active' | 'rejected' | 'blocked'
    }
  };
}
```

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run test             # Run tests
```

## 🚦 User Status Types

| Status | Login | App Access | Description |
|--------|-------|------------|-------------|
| `pending` | ❌ | ❌ | Awaiting admin approval |
| `active` | ✅ | ✅ | Full access granted |
| `rejected` | ❌ | ❌ | Registration rejected |
| `blocked` | ❌ | ❌ | Account blocked |

## 🔜 Coming Next

- Attendance marking with validation
- Geofencing validation
- WiFi network detection
- Attendance history
- Report generation

## 📖 Original Lovable Project Info

**URL**: https://preview--nexon-time-keeper.lovable.app/login
