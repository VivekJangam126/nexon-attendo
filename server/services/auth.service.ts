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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error,
      };
    }

    if (!data.user) {
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
    const { profile } = await profileService.getProfile(data.user.id);

    if (!profile) {
      // Profile doesn't exist - sign out and block
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
      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    }

    // Fallback: Unknown status
    await supabase.auth.signOut();
    return {
      user: null,
      session: null,
      error: {
        name: 'StatusError',
        message: 'Invalid account status',
      } as any,
    };
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
   * Validates current password and updates to new password
   * Clears password_reset_required flag after successful change
   * 
   * @param currentPassword - Current password for validation
   * @param newPassword - New password to set
   * @returns Success status and error if any
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('🔑 [CHANGE PASSWORD] Starting password change process');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ [CHANGE PASSWORD] No authenticated user:', userError);
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
  },
};
