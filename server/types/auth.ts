/**
 * Authentication Types
 * Reusable interfaces for authentication operations
 */

import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthSession {
  user: User | null;
  session: Session | null;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SessionResponse {
  session: Session | null;
  error: AuthError | null;
}

export interface UserResponse {
  user: User | null;
  error: AuthError | null;
}
