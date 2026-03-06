/**
 * User Profile Types
 * Reusable interfaces for user profile data
 */

export type UserRole = 'employee' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'blocked';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  office_location: string | null;
  office_name?: string | null;
  phone?: string | null;
  password_reset_required?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  profile: UserProfile | null;
  error: Error | null;
}
