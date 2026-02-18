/**
 * Office Service
 * Handles office location operations
 * Phase 2: Multi-office awareness for registration and assignment
 */

import { supabase } from '../supabase/client';
import type { Office, OfficeResponse, OfficesListResponse } from '../types/office';

export const officeService = {
  /**
   * Get all active offices
   * Used for registration office selection
   * 
   * @returns List of active offices
   */
  async getActiveOffices(): Promise<OfficesListResponse> {
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        return {
          offices: [],
          error: new Error(`Failed to fetch offices: ${error.message}`),
        };
      }

      return {
        offices: (data || []) as Office[],
        error: null,
      };
    } catch (err) {
      return {
        offices: [],
        error: err instanceof Error ? err : new Error('Failed to fetch offices'),
      };
    }
  },

  /**
   * Get office by ID
   * 
   * @param officeId - Office ID
   * @returns Office details
   */
  async getOfficeById(officeId: string): Promise<OfficeResponse> {
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .eq('id', officeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { office: null, error: null };
        }
        return {
          office: null,
          error: new Error(error.message),
        };
      }

      return {
        office: data as Office,
        error: null,
      };
    } catch (err) {
      return {
        office: null,
        error: err instanceof Error ? err : new Error('Failed to fetch office'),
      };
    }
  },

  /**
   * Get all offices (admin only)
   * 
   * @returns List of all offices
   */
  async getAllOffices(): Promise<OfficesListResponse> {
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return {
          offices: [],
          error: new Error(`Failed to fetch offices: ${error.message}`),
        };
      }

      return {
        offices: (data || []) as Office[],
        error: null,
      };
    } catch (err) {
      return {
        offices: [],
        error: err instanceof Error ? err : new Error('Failed to fetch offices'),
      };
    }
  },

  /**
   * Update office details (admin only)
   * 
   * @param officeId - Office ID
   * @param updates - Partial office data to update
   * @returns Updated office or error
   */
  async updateOffice(officeId: string, updates: Partial<Office>): Promise<OfficeResponse> {
    try {
      const { data, error } = await supabase
        .from('offices')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', officeId)
        .select()
        .single();

      if (error) {
        return {
          office: null,
          error: new Error(`Failed to update office: ${error.message}`),
        };
      }

      return {
        office: data as Office,
        error: null,
      };
    } catch (err) {
      return {
        office: null,
        error: err instanceof Error ? err : new Error('Failed to update office'),
      };
    }
  },

  /**
   * Create new office (admin only)
   * 
   * @param officeData - Office data
   * @returns Created office or error
   */
  async createOffice(officeData: Omit<Office, 'id' | 'created_at' | 'updated_at'>): Promise<OfficeResponse> {
    try {
      const { data, error } = await supabase
        .from('offices')
        .insert({
          ...officeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          office: null,
          error: new Error(`Failed to create office: ${error.message}`),
        };
      }

      return {
        office: data as Office,
        error: null,
      };
    } catch (err) {
      return {
        office: null,
        error: err instanceof Error ? err : new Error('Failed to create office'),
      };
    }
  },

  /**
   * Delete office (admin only)
   * Note: This will fail if employees are assigned to this office
   * 
   * @param officeId - Office ID
   * @returns Success status or error
   */
  async deleteOffice(officeId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Check if any employees are assigned to this office
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('office_location', officeId);

      if (countError) {
        return {
          success: false,
          error: new Error(`Failed to check office usage: ${countError.message}`),
        };
      }

      if (count && count > 0) {
        return {
          success: false,
          error: new Error(`Cannot delete office: ${count} employee(s) are assigned to this office`),
        };
      }

      // Delete the office
      const { error } = await supabase
        .from('offices')
        .delete()
        .eq('id', officeId);

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to delete office: ${error.message}`),
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to delete office'),
      };
    }
  },

  /**
   * Toggle office active status (admin only)
   * 
   * @param officeId - Office ID
   * @param isActive - New active status
   * @returns Updated office or error
   */
  async toggleOfficeStatus(officeId: string, isActive: boolean): Promise<OfficeResponse> {
    return this.updateOffice(officeId, { is_active: isActive });
  },

  /**
   * Get employee count for an office
   * 
   * @param officeId - Office ID
   * @returns Employee count or error
   */
  async getOfficeEmployeeCount(officeId: string): Promise<{ count: number; error: Error | null }> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('office_location', officeId)
        .eq('role', 'employee');

      if (error) {
        return {
          count: 0,
          error: new Error(`Failed to get employee count: ${error.message}`),
        };
      }

      return {
        count: count || 0,
        error: null,
      };
    } catch (err) {
      return {
        count: 0,
        error: err instanceof Error ? err : new Error('Failed to get employee count'),
      };
    }
  },
};
