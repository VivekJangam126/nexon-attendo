/**
 * Profile Service
 * Handles user profile operations
 */

import { supabase } from '../config/supabase';
import { UserProfile } from '../types/auth';

/**
 * Get user profile by ID
 */
export const getProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    throw error;
  }
};
