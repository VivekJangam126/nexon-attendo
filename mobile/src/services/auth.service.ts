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
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Exception getting current user:', error);
    return null;
  }
};

/**
 * Get user profile from database
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  try {
    console.log('👤 Fetching profile for user:', userId);
    
    // First, get the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.log('  ❌ Profile fetch failed:', profileError.message);
      return {
        profile: null,
        error: new Error(profileError.message),
      };
    }
    
    if (!profileData) {
      console.log('  ❌ No profile found');
      return {
        profile: null,
        error: new Error('Profile not found'),
      };
    }

    // If user has an office assigned, fetch the office name
    let officeName = null;
    if (profileData.office_location) {
      console.log('  🏢 Fetching office name for:', profileData.office_location);
      
      const { data: officeData, error: officeError } = await supabase
        .from('offices')
        .select('name')
        .eq('id', profileData.office_location)
        .single();

      if (officeError) {
        console.warn('  ⚠️  Could not fetch office name:', officeError.message);
        console.warn('  ⚠️  Error code:', officeError.code);
        console.warn('  ⚠️  This usually means:');
        console.warn('      - Office does not exist in offices table');
        console.warn('      - RLS policy blocking access');
        console.warn('      - offices table does not exist');
      } else if (officeData) {
        officeName = officeData.name;
        console.log('  ✅ Office name fetched:', officeName);
      } else {
        console.warn('  ⚠️  Office query returned no data');
      }
    } else {
      console.log('  ℹ️  No office assigned to user');
    }

    const profile: UserProfile = {
      ...profileData,
      office_name: officeName,
    };
    
    console.log('  ✅ Profile fetched');
    console.log('    Name:', profile.full_name);
    console.log('    Role:', profile.role);
    console.log('    Status:', profile.status);
    console.log('    Office Location:', profile.office_location);
    console.log('    Office Name:', profile.office_name);
    
    return {
      profile,
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

/**
 * Change user password
 * Validates current password and updates to new password
 * Clears password_reset_required flag after successful change
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    console.log('🔑 [CHANGE PASSWORD] Starting password change process');

    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('❌ [CHANGE PASSWORD] No authenticated user');
      return {
        success: false,
        error: new Error('Not authenticated'),
      };
    }

    // Validate current password by attempting to sign in
    const { error: validateError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (validateError) {
      console.error('❌ [CHANGE PASSWORD] Current password validation failed:', validateError);
      return {
        success: false,
        error: new Error('Current password is incorrect'),
      };
    }

    console.log('✅ [CHANGE PASSWORD] Current password validated');

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('❌ [CHANGE PASSWORD] Failed to update password:', updateError);
      return {
        success: false,
        error: new Error('Failed to update password'),
      };
    }

    console.log('✅ [CHANGE PASSWORD] Password updated successfully');

    // Clear password_reset_required flag
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        password_reset_required: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.warn('⚠️ [CHANGE PASSWORD] Could not clear reset flag:', profileError);
      // Don't fail the whole operation for this
    } else {
      console.log('✅ [CHANGE PASSWORD] Reset flag cleared');
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('❌ [CHANGE PASSWORD] Exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to change password'),
    };
  }
};

export const authService = {
  login,
  logout,
  getSession,
  getCurrentUser,
  getProfile,
  onAuthStateChange,
  changePassword,
};
