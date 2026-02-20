/**
 * Authentication Types
 */

import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'employee' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'blocked';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string | null;
  role: UserRole;
  status: UserStatus;
  office_location: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export interface ProfileResponse {
  profile: UserProfile | null;
  error: Error | null;
}
