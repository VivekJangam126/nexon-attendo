/**
 * Supabase Client Configuration
 * Configured with AsyncStorage for session persistence
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Please check your .env file and ensure:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL is set\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY is set'
  );
}

/**
 * Supabase client with AsyncStorage for session persistence
 * Sessions will persist across app restarts
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
