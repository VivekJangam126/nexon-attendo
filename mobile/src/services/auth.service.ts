/**
 * Authentication Service
 * Handles login, logout, and session management
 */

import { supabase } from '../config/supabase';
import { AuthResponse, ProfileResponse, UserProfile } from '../types/auth';
import { clearAllData } from '../utils/storage';

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('🔐 Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('  ❌ Login failed:', error.message);
      return {
        user: null,
        session: null,
        error: new Error(error.message),
      };
    }
    
    if (!data.user || !data.session) {
      console.log('  ❌ No user or session returned');
      return {
        user: null,
        session: null,
        error: new Error('Authentication failed'),
      };
    }
    
    console.log('  ✅ Login successful');
    console.log('    User ID:', data.user.id);
    console.log('    Email:', data.user.email);
    
    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    console.error('  ❌ Login exception:', error);
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error : new Error('Login failed'),
    };
  }
};

/**
 * Logout current user
 */
export const logout = async (): Promise<{ error: Error | null }> => {
  try {
    console.log('🚪 Logging out...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.log('  ❌ Logout failed:', error.message);
      return { error: new Error(error.message) };
    }
    
    // Clear app data
    await clearAllData();
    
    console.log('  ✅ Logout successful');
    return { error: null };
  } catch (error) {
    console.error('  ❌ Logout exception:', error);
    return {
      error: error instanceof Error ? error : new Error('Logout failed'),
    };
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { session: null, error };
    }
    
    return { session: data.session, error: null };
  } catch (error) {
    console.error('Exception getting session:', error);
    return { session: null, error };
  }
};

/**
 * Get user profile from database
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  try {
    console.log('👤 Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log('  ❌ Profile fetch failed:', error.message);
      return {
        profile: null,
        error: new Error(error.message),
      };
    }
    
    if (!data) {
      console.log('  ❌ No profile found');
      return {
        profile: null,
        error: new Error('Profile not found'),
      };
    }
    
    console.log('  ✅ Profile fetched');
    console.log('    Name:', data.full_name);
    console.log('    Role:', data.role);
    console.log('    Status:', data.status);
    
    return {
      profile: data as UserProfile,
      error: null,
    };
  } catch (error) {
    console.error('  ❌ Profile fetch exception:', error);
    return {
      profile: null,
      error: error instanceof Error ? error : new Error('Failed to fetch profile'),
    };
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (session: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};
