/**
 * Employee Request Types
 * Type definitions for employee registration requests
 */

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface EmployeeRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  office_id: string;
  status: RequestStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRequestWithOffice extends EmployeeRequest {
  office_name?: string;
  reviewer_name?: string;
}

export interface EmployeeRequestResponse {
  request: EmployeeRequest | null;
  error: Error | null;
}

export interface EmployeeRequestsListResponse {
  requests: EmployeeRequestWithOffice[];
  error: Error | null;
}

export interface ApprovalResponse {
  success: boolean;
  error: Error | null;
}
