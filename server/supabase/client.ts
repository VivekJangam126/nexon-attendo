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

/**
 * Admin Supabase client with service role key
 * Used for admin operations like password reset
 */
const getAdminClient = () => {
  // Try to get service role key from environment
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                        import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('Service role key not found. Admin operations may fail.');
    return supabase; // Fallback to regular client
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const supabaseAdmin = getAdminClient();
