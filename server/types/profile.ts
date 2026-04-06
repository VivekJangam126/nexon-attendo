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
  designation?: string | null;
  role_type?: string | null;
  profile_photo_url?: string | null;
  gender?: string | null; // "male" | "female" | null
  created_at: string;
  updated_at: string;
  // Shift-related fields
  shift_type?: string;
  shift_mode?: string;
  shift_config?: Record<string, any>;
  office_id?: string;
}

export interface ProfileResponse {
  profile: UserProfile | null;
  error: Error | null;
}
