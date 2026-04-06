/**
 * Authentication Service
 * Handles all authentication operations using Supabase Auth
 * Phase 2: Login restrictions based on user status
 */

import { supabase } from '../supabase/client';
import type { AuthResponse, SessionResponse, UserResponse } from '../types/auth';
import { profileService } from './profile.service';
import { rateLimitService } from './rate-limit.service';
import { extractClientIP } from '../utils/ip-extractor';

export const authService = {
  /**
   * Login with email and password
   * Phase 2: Enforces login restrictions based on user status
   * Phase 2 Security: Rate limiting (5 attempts per 10 minutes)
   * SINGLE OFFICE MODE: Auto-assigns office if missing
   * - pending → login blocked
   * - rejected → login blocked
   * - active → login allowed
   * 
   * @param email - User email
   * @param password - User password
   * @param ipAddress - Client IP address (optional, for rate limiting)
   * @returns AuthResponse with user, session, and error
   */
  async login(email: string, password: string, ipAddress?: string): Promise<AuthResponse> {
    console.log('🔐 [AUTH.login] START - email:', email);
    
    try {
      // ============================================
      // RATE LIMITING CHECK (FIRST LINE OF DEFENSE)
      // ============================================
      const clientIP = ipAddress || 'unknown';
      console.log('🔒 [RATE LIMIT] Checking login rate limit for:', clientIP, email);
      
      const rateLimitCheck = await rateLimitService.checkLogin(clientIP, email);
      
      if (!rateLimitCheck.allowed) {
        console.log('  ❌ Rate limit exceeded');
        return {
          user: null,
          session: null,
          error: {
            name: 'RateLimitError',
            message: `Too many login attempts. Please try again at ${rateLimitCheck.resetAt.toLocaleTimeString()}.`,
          } as any,
        };
      }
      
      console.log(`  ✅ Rate limit OK (${rateLimitCheck.remaining} remaining)`);

      // Step 1: Authenticate with Supabase
      console.log('🔐 [AUTH] Attempting Supabase auth signin for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('🔐 [AUTH] Supabase auth error:', error.message);
        return {
          user: null,
          session: null,
          error,
        };
      }

      console.log('🔐 [AUTH] Supabase auth successful, user ID:', data.user?.id);

      if (!data.user) {
        console.log('🔐 [AUTH] No user returned from Supabase');
        return {
          user: null,
          session: null,
          error: {
            name: 'AuthError',
            message: 'Authentication failed',
          } as any,
        };
      }

      // Step 2: Check user profile status
      console.log('🔐 [PROFILE] Fetching profile for user:', data.user.id);
      const { profile } = await profileService.getProfile(data.user.id);

      if (!profile) {
        // Profile doesn't exist - sign out and block
        console.log('🔐 [PROFILE] Profile not found, signing out');
        await supabase.auth.signOut();
        return {
          user: null,
          session: null,
          error: {
            name: 'ProfileError',
            message: 'User profile not found',
          } as any,
        };
      }

      console.log('🔐 [PROFILE] Profile found - Status:', profile.status, 'Role:', profile.role);

    // SINGLE OFFICE MODE: Auto-assign office if missing (safety net)
    if (profile.role === 'employee' && !profile.office_location) {
      console.log('🔍 [LOGIN SAFETY NET] Employee has no office, auto-assigning...');
      
      const { data: activeOffice } = await supabase
        .from('offices')
        .select('id, name')
        .eq('is_active', true)
        .single();

      if (activeOffice) {
        const officeData = activeOffice as any;
        await supabase
          .from('profiles')
          .update({ office_location: officeData.id } as any)
          .eq('id', data.user.id);
        
        console.log('  ✅ Auto-assigned to:', officeData.name);
        
        // Refresh profile
        const { profile: updatedProfile } = await profileService.getProfile(data.user.id);
        if (updatedProfile) {
          Object.assign(profile, updatedProfile);
        }
      } else {
        console.log('  ⚠️  No active office found for auto-assignment');
      }
    }

    // Step 3: Enforce status-based login restrictions
    if (profile.status === 'pending') {
      // Pending users cannot login
      console.log('🔐 [STATUS] User is pending - blocking login');
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        error: {
          name: 'StatusError',
          message: 'Your account is pending approval. Please wait for admin approval.',
          status: 'pending',
        } as any,
      };
    }

    if (profile.status === 'rejected') {
      // Rejected users cannot login
      console.log('🔐 [STATUS] User is rejected - blocking login');
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        error: {
          name: 'StatusError',
          message: 'Your account has been rejected. Please contact support.',
          status: 'rejected',
        } as any,
      };
    }

    if (profile.status === 'blocked') {
      // Blocked users cannot login
      console.log('🔐 [STATUS] User is blocked - blocking login');
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        error: {
          name: 'StatusError',
          message: 'Your account has been blocked. Please contact support.',
          status: 'blocked',
        } as any,
      };
    }

    // Step 4: Only 'active' users can proceed
    if (profile.status === 'active') {
      console.log('🔐 [STATUS] User is active - allowing login');
      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    }

    // Fallback: Unknown status
    console.log('🔐 [STATUS] Unknown status:', profile.status, '- blocking login');
    await supabase.auth.signOut();
    return {
      user: null,
      session: null,
      error: {
        name: 'StatusError',
        message: 'Invalid account status',
      } as any,
    };
    } catch (err) {
      console.error('🔐 [AUTH] Unexpected error in login:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        user: null,
        session: null,
        error: {
          name: 'UnexpectedError',
          message: 'An unexpected error occurred during login: ' + errorMsg,
        } as any,
      };
    }
  },

  /**
   * Logout current user
   * @returns Error if logout fails
   */
  async logout(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  },

  /**
   * Get current session
   * @returns Current session or null
   */
  async getSession(): Promise<SessionResponse> {
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data.session,
      error,
    };
  },

  /**
   * Get current authenticated user
   * @returns Current user or null
   */
  async getCurrentUser(): Promise<UserResponse> {
    const { data, error } = await supabase.auth.getUser();
    return {
      user: data.user,
      error,
    };
  },

  /**
   * Listen to authentication state changes
   * @param callback - Function to call when auth state changes
   * @returns Subscription object with unsubscribe method
   */
  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },

  /**
   * Change user password
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Success status and error if any
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // First verify current password by attempting to sign in
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (!currentUser.user?.email) {
        return {
          success: false,
          error: new Error('User not authenticated')
        };
      }

      // Verify current password by attempting sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentUser.user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return {
          success: false,
          error: new Error('Current password is incorrect')
        };
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return {
          success: false,
          error: new Error(updateError.message)
        };
      }

      return {
        success: true,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to change password')
      };
    }
  },
};
