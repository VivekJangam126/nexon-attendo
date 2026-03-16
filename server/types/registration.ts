/**
 * Registration Types
 * Type definitions for employee registration
 */

export interface RegistrationData {
  email: string;
  password: string;
  full_name: string;
  office_id: string;
  designation?: string;
  role_type?: 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern';
  profile_photo?: File; // For admin use (server-side)
  profile_photo_url?: string; // For client-side registration
}

export interface RegistrationResponse {
  success: boolean;
  userId: string | null;
  error: Error | null;
  message?: string;
}
