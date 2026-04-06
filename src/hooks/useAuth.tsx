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
      console.log('🔐 [useAuth.login] Starting login for:', email);
      
      // Create a timeout promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login request timed out after 15 seconds')), 15000)
      );

      // Race between login and timeout
      const loginPromise = authService.login(email, password);
      const { user: authUser, error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any;
      
      console.log('🔐 [useAuth.login] authService.login response - user:', !!authUser, 'error:', error?.message);
      
      if (error) {
        console.log('🔐 [useAuth.login] Login error - returning error');
        return { error: new Error(error.message) };
      }

      if (authUser) {
        console.log('🔐 [useAuth.login] Login successful, fetching profile');
        // Fetch profile after successful login
        await fetchProfile(authUser.id);
        console.log('🔐 [useAuth.login] Profile fetched successfully');
      }

      return { error: null };
    } catch (err) {
      console.error('🔐 [useAuth.login] Catch error:', err);
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

  const value = {
    user,
    session,
    profile,
    loading,
    login,
    logout,
    refreshProfile,
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
