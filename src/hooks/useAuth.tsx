import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService, profileService } from '@server';
import type { UserProfile } from '@server';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile after user is set
  const fetchProfile = async (userId: string) => {
    const { profile: userProfile } = await profileService.getProfile(userId);
    setProfile(userProfile);
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ session: currentSession }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: authUser, error } = await authService.login(email, password);
      
      if (error) {
        return { error: new Error(error.message) };
      }

      if (authUser) {
        // Fetch profile after successful login
        await fetchProfile(authUser.id);
      }

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Login failed'),
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        // Refresh profile to clear password_reset_required flag
        await refreshProfile();
      }
      
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to change password'),
      };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    login,
    logout,
    refreshProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
