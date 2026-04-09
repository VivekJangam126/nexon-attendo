import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Supabase Client Configuration
 * Reads credentials from environment variables
 * 
 * For Frontend (browser):
 *   - Uses import.meta.env.VITE_* (injected by Vite from .env files)
 * 
 * For Backend (Node.js via Vite middleware):
 *   - Uses process.env.VITE_* (set by vite.config.ts from .env files)
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous key (public, respects RLS)
 * - VITE_SUPABASE_SERVICE_KEY: Supabase service role key (private, bypasses RLS - backend only)
 */

// Helper to get environment variables from both contexts
const getEnv = (key: string): string => {
  // Try import.meta.env first (frontend - Vite exposes VITE_* vars here)
  try {
    const val = (import.meta.env as Record<string, any>)[key];
    if (val) return val;
  } catch (e) {
    // import.meta not available in backend context
  }
  
  // Fall back to process.env (backend/Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabaseServiceKey = getEnv('VITE_SUPABASE_SERVICE_KEY');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!supabaseServiceKey) missing.push('VITE_SUPABASE_SERVICE_KEY');
  
  throw new Error(
    `Missing required Supabase environment variables:\n${missing.join(', ')}\n\n` +
    'For Vercel deployment, add these to your environment variables in the Vercel dashboard.\n' +
    'For local development, create a .env.local file in the root directory.'
  );
}

/**
 * Type-safe Supabase client instance (anon key - respects RLS)
 * Used by frontend
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Service role Supabase client (bypasses RLS)
 * Used by backend API routes only
 * Only created if service key is available (backend context)
 */
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : (supabase as any);

