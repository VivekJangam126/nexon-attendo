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
    console.log('👤 Fetching profile for user:', userId);
    
    // First, get the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      throw new Error('Failed to fetch profile');
    }

    // If user has an office assigned, fetch the office name
    let officeName = null;
    if (profileData.office_location) {
      console.log('🏢 Fetching office name for:', profileData.office_location);
      
      const { data: officeData, error: officeError } = await supabase
        .from('offices')
        .select('name')
        .eq('id', profileData.office_location)
        .single();

      if (officeError) {
        console.warn('⚠️  Could not fetch office name:', officeError.message);
        console.warn('⚠️  Error code:', officeError.code);
      } else if (officeData) {
        officeName = officeData.name;
        console.log('✅ Office name fetched:', officeName);
      } else {
        console.warn('⚠️  Office query returned no data');
      }
    }

    const profile: UserProfile = {
      ...profileData,
      office_name: officeName,
    };

    console.log('✅ Profile fetched:', {
      name: profile.full_name,
      email: profile.email,
      office_location: profile.office_location,
      office_name: profile.office_name,
    });

    return profile;
  } catch (error) {
    console.error('❌ Exception fetching profile:', error);
    throw error;
  }
};
