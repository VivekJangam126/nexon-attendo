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
};
