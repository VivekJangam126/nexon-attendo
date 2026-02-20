/**
 * Supabase Client Configuration
 * Configured with AsyncStorage for session persistence
 */

// Import URL polyfill for React Native
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get environment variables with detailed logging
console.log('🔍 Loading Supabase config...');
console.log('Constants.expoConfig:', Constants.expoConfig ? 'exists' : 'missing');
console.log('Constants.expoConfig.extra:', Constants.expoConfig?.extra ? 'exists' : 'missing');

const supabaseUrl = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Supabase Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('Key:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
  
  // Don't throw - let the app handle it gracefully
  // throw new Error(
  //   'Missing Supabase environment variables.\n' +
  //   'Please check your .env file and ensure:\n' +
  //   '- EXPO_PUBLIC_SUPABASE_URL is set\n' +
  //   '- EXPO_PUBLIC_SUPABASE_ANON_KEY is set'
  // );
}

/**
 * Supabase client with AsyncStorage for session persistence
 * Sessions will persist across app restarts
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'nexus-attendo-mobile',
      },
    },
  }
);

console.log('✅ Supabase client created');
