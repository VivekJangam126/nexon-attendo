import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Supabase Client Configuration
 * Reads credentials from environment variables only
 * No hardcoded secrets
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

/**
 * Type-safe Supabase client instance
 * Used by all backend services
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
