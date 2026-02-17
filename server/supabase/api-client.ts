/**
 * Supabase API Client
 * For use in API endpoints (Vercel serverless functions)
 * Uses process.env instead of import.meta.env
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Create Supabase client for API endpoints
 * This function creates a new client instance each time it's called
 * to ensure fresh environment variables in serverless context
 */
export function createApiClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables in API context.\n' +
      'Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY)'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Default export for convenience
 */
export const apiSupabase = createApiClient();
