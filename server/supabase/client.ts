import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Supabase Client Configuration
 * Reads credentials from environment variables
 */

// Get from import.meta.env (Vite client-side) with fallback to hardcoded values
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';

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
