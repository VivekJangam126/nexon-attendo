/**
 * Admin Approval Service
 * Handles employee approval/rejection workflows
 * Phase 2: Admin-only operations for managing employee requests
 */

import { supabase } from '../supabase/client';
import type {
  EmployeeRequest,
  EmployeeRequestWithOffice,
  EmployeeRequestsListResponse,
  ApprovalResponse,
} from '../types/employee-request';
import type { UserProfile } from '../types/profile';

export const adminApprovalService = {
  /**
   * Fetch all pending employee requests
   * Admin-only: Requires admin role verification
   * 
   * @param adminProfile - Admin user profile for authorization
   * @returns List of pending requests with office details
   */
  async getPendingRequests(
    adminProfile: UserProfile
  ): Promise<EmployeeRequestsListResponse> {
    try {
      // Enforce admin-only access
      if (adminProfile.role !== 'admin') {
        return {
          requests: [],
          error: new Error('Unauthorized: Admin access required'),
        };
      }

      const { data, error } = await supabase
        .from('employee_requests')
        .select(`
          *,
          offices:office_id (
            name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          requests: [],
          error: new Error(`Failed to fetch requests: ${error.message}`),
        };
      }

      // Map office name to requests
      const requests: EmployeeRequestWithOffice[] = (data || []).map((req: any) => ({
        ...req,
        office_name: req.offices?.name || 'Unknown Office',
      }));

      return {
        requests,
        error: null,
      };
    } catch (err) {
      return {
        requests: [],
        error: err instanceof Error ? err : new Error('Failed to fetch requests'),
      };
    }
  },

  /**
   * Fetch all employee requests (pending, approved, rejected)
   * Admin-only
   * 
   * @param adminProfile - Admin user profile for authorization
   * @returns List of all requests
   */
  async getAllRequests(
    adminProfile: UserProfile
  ): Promise<EmployeeRequestsListResponse> {
    try {
      if (adminProfile.role !== 'admin') {
        return {
          requests: [],
          error: new Error('Unauthorized: Admin access required'),
        };
      }

      const { data, error } = await supabase
        .from('employee_requests')
        .select(`
          *,
          offices:office_id (
            name
          ),
          reviewer:reviewed_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          requests: [],
          error: new Error(`Failed to fetch requests: ${error.message}`),
        };
      }

      const requests: EmployeeRequestWithOffice[] = (data || []).map((req: any) => ({
        ...req,
        office_name: req.offices?.name || 'Unknown Office',
        reviewer_name: req.reviewer?.full_name || null,
      }));

      return {
        requests,
        error: null,
      };
    } catch (err) {
      return {
        requests: [],
        error: err instanceof Error ? err : new Error('Failed to fetch requests'),
      };
    }
  },

  /**
   * Approve an employee request
   * Sets profile.status = 'active' and updates employee_request
   * Admin-only operation
   * 
   * @param requestId - Employee request ID
   * @param adminProfile - Admin user profile for authorization
   * @param officeId - Optional: Change office during approval
   * @returns ApprovalResponse
   */
  async approveRequest(
    requestId: string,
    adminProfile: UserProfile,
    officeId?: string
  ): Promise<ApprovalResponse> {
    try {
      // Enforce admin-only access
      if (adminProfile.role !== 'admin') {
        return {
          success: false,
          error: new Error('Unauthorized: Admin access required'),
        };
      }

      // Fetch the request
      const { data: request, error: fetchError } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return {
          success: false,
          error: new Error('Request not found'),
        };
      }

      const userId = request.user_id;
      const finalOfficeId = officeId || request.office_id;

      // Step 1: Update profile status to 'active'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          office_location: finalOfficeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        return {
          success: false,
          error: new Error(`Failed to update profile: ${profileError.message}`),
        };
      }

      // Step 2: Update employee_request status
      const { error: requestError } = await supabase
        .from('employee_requests')
        .update({
          status: 'approved',
          reviewed_by: adminProfile.id,
          reviewed_at: new Date().toISOString(),
          office_id: finalOfficeId,
        })
        .eq('id', requestId);

      if (requestError) {
        console.error('Failed to update request:', requestError);
        // Profile is already active, so we continue
      }

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Approval failed'),
      };
    }
  },

  /**
   * Reject an employee request
   * Sets profile.status = 'rejected' and stores rejection reason
   * Admin-only operation
   * 
   * @param requestId - Employee request ID
   * @param adminProfile - Admin user profile for authorization
   * @param reason - Rejection reason
   * @returns ApprovalResponse
   */
  async rejectRequest(
    requestId: string,
    adminProfile: UserProfile,
    reason: string
  ): Promise<ApprovalResponse> {
    try {
      // Enforce admin-only access
      if (adminProfile.role !== 'admin') {
        return {
          success: false,
          error: new Error('Unauthorized: Admin access required'),
        };
      }

      // Fetch the request
      const { data: request, error: fetchError } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return {
          success: false,
          error: new Error('Request not found'),
        };
      }

      const userId = request.user_id;

      // Step 1: Update profile status to 'rejected'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        return {
          success: false,
          error: new Error(`Failed to update profile: ${profileError.message}`),
        };
      }

      // Step 2: Update employee_request with rejection details
      const { error: requestError } = await supabase
        .from('employee_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: adminProfile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) {
        console.error('Failed to update request:', requestError);
      }

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Rejection failed'),
      };
    }
  },

  /**
   * Get employee request by user ID
   * Used to check request status for the logged-in user
   * 
   * @param userId - User ID
   * @returns Employee request or null
   */
  async getRequestByUserId(userId: string): Promise<{
    request: EmployeeRequest | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { request: null, error: null };
        }
        return {
          request: null,
          error: new Error(error.message),
        };
      }

      return {
        request: data as EmployeeRequest,
        error: null,
      };
    } catch (err) {
      return {
        request: null,
        error: err instanceof Error ? err : new Error('Failed to fetch request'),
      };
    }
  },
};
