/**
 * Profile Service
 * Handles user profile operations from the profiles table
 * Phase 1: Foundation only - fetch and expose profile data
 */

import { supabase } from '../supabase/client';
import type { UserProfile, ProfileResponse } from '../types/profile';

export const profileService = {
  /**
   * Fetch user profile by user ID
   * Gracefully handles missing profiles (for future registration flow)
   * @param userId - User ID from auth
   * @returns ProfileResponse with profile or null
   */
  async getProfile(userId: string): Promise<ProfileResponse> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows returned (profile doesn't exist)
        if (error.code === 'PGRST116') {
          return { profile: null, error: null };
        }
        throw error;
      }

      // Fetch office name if office_location exists
      let officeName: string | null = null;
      if (data.office_location) {
        const { data: officeData, error: officeError } = await supabase
          .from('offices')
          .select('name')
          .eq('id', data.office_location)
          .single();
        
        if (officeData && !officeError) {
          officeName = officeData.name;
        }
      }

      const profile: UserProfile = {
        ...data,
        office_name: officeName,
      };

      return { profile, error: null };
    } catch (err) {
      return {
        profile: null,
        error: err instanceof Error ? err : new Error('Failed to fetch profile'),
      };
    }
  },

  /**
   * Fetch user profile by email
   * @param email - User email
   * @returns ProfileResponse with profile or null
   */
  async getProfileByEmail(email: string): Promise<ProfileResponse> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { profile: null, error: null };
        }
        throw error;
      }

      return { profile: data as UserProfile, error: null };
    } catch (err) {
      return {
        profile: null,
        error: err instanceof Error ? err : new Error('Failed to fetch profile'),
      };
    }
  },
};
