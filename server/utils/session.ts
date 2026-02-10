/**
 * Session Utilities
 * Helper functions for session and authentication state management
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * Check if session is valid and not expired
 * @param session - Supabase session object
 * @returns true if session is valid
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  const expiresAt = session.expires_at;
  if (!expiresAt) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return now < expiresAt;
}

/**
 * Check if user is authenticated
 * @param user - Supabase user object
 * @returns true if user exists
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null;
}

/**
 * Extract user ID from session
 * @param session - Supabase session object
 * @returns User ID or null
 */
export function getUserIdFromSession(session: Session | null): string | null {
  return session?.user?.id ?? null;
}

/**
 * Extract user email from session
 * @param session - Supabase session object
 * @returns User email or null
 */
export function getUserEmailFromSession(session: Session | null): string | null {
  return session?.user?.email ?? null;
}
