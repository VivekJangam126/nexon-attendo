/**
 * Registration Types
 * Type definitions for employee registration
 */

export interface RegistrationData {
  email: string;
  password: string;
  full_name: string;
  office_id: string;
}

export interface RegistrationResponse {
  success: boolean;
  userId: string | null;
  error: Error | null;
  message?: string;
}
