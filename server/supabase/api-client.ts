/**
 * Supabase Client for API Routes
 * This client is created on-demand to avoid env var issues
 */

import { createClient } from '@supabase/supabase-js';

let cachedClient: any = null;

export function getSupabaseClient() {
  if (!cachedClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://falbkccaqjqdbvrmdlll.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
    
    cachedClient = createClient(supabaseUrl, supabaseKey);
  }
  
  return cachedClient;
}
