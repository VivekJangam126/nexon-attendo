/**
 * Authentication Service
 * Handles all authentication operations using Supabase Auth
 * Phase 2: Login restrictions based on user status
 */

import { supabase } from '../supabase/client';
import type { AuthResponse, SessionResponse, UserResponse } from '../types/auth';
import { profileService } from './profile.service';

export const authService = {
  /**
   * Login with email and password
   * Phase 2: Enforces login restrictions based on user status
   * - pending → login blocked
   * - rejected → login blocked
   * - active → login allowed
   * 
   * @param email - User email
   * @param password - User password
   * @returns AuthResponse with user, session, and error
   */
  async login(email: string, password: string): Promise<AuthResponse> {
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
};
