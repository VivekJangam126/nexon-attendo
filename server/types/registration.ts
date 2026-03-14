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
}

export interface RegistrationResponse {
  success: boolean;
  userId: string | null;
  error: Error | null;
  message?: string;
}
