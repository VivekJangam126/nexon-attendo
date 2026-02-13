/**
 * Office Network Service
 * Manages office network configurations for Wi-Fi verification
 */

import { supabase } from '../supabase/client';
import type { OfficeNetwork } from '../types/office';

export const officeNetworkService = {
  /**
   * Get all active networks for an office
   */
  async getOfficeNetworks(officeId: string): Promise<{
    networks: OfficeNetwork[];
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('office_networks')
        .select('*')
        .eq('office_id', officeId)
        .eq('is_active', true);

      if (error) {
        return {
          networks: [],
          error: new Error(error.message),
        };
      }

      return {
        networks: (data || []) as OfficeNetwork[],
        error: null,
      };
    } catch (err) {
      return {
        networks: [],
        error: err instanceof Error ? err : new Error('Failed to fetch office networks'),
      };
    }
  },

  /**
   * Check if IP address matches any office network
   */
  async verifyIPAddress(officeId: string, ipAddress: string): Promise<{
    isValid: boolean;
    matchedNetwork: OfficeNetwork | null;
    error: Error | null;
  }> {
    try {
      console.log('🔍 [WIFI VERIFICATION]');
      console.log('  Office ID:', officeId);
      console.log('  IP Address:', ipAddress);

      const { networks, error } = await this.getOfficeNetworks(officeId);

      if (error || networks.length === 0) {
        console.log('  ❌ No networks found for office');
        return {
          isValid: false,
          matchedNetwork: null,
          error: error || new Error('No office networks configured'),
        };
      }

      console.log('  📡 Checking against networks:', networks.map(n => n.ip_range));

      // Check if IP matches any network range
      for (const network of networks) {
        if (ipAddress.startsWith(network.ip_range)) {
          console.log('  ✅ IP matches network:', network.network_name);
          return {
            isValid: true,
            matchedNetwork: network,
            error: null,
          };
        }
      }

      console.log('  ❌ IP does not match any office network');
      return {
        isValid: false,
        matchedNetwork: null,
        error: null,
      };
    } catch (err) {
      console.log('  ❌ Exception in IP verification:', err);
      return {
        isValid: false,
        matchedNetwork: null,
        error: err instanceof Error ? err : new Error('Failed to verify IP address'),
      };
    }
  },

  /**
   * Add a network to an office
   */
  async addOfficeNetwork(
    officeId: string,
    networkName: string,
    ipRange: string
  ): Promise<{
    success: boolean;
    network: OfficeNetwork | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('office_networks')
        .insert({
          office_id: officeId,
          network_name: networkName,
          ip_range: ipRange,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          network: null,
          error: new Error(error.message),
        };
      }

      return {
        success: true,
        network: data as OfficeNetwork,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        network: null,
        error: err instanceof Error ? err : new Error('Failed to add office network'),
      };
    }
  },

  /**
   * Update an office network
   */
  async updateOfficeNetwork(
    networkId: string,
    updates: Partial<Pick<OfficeNetwork, 'network_name' | 'ip_range' | 'is_active'>>
  ): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await supabase
        .from('office_networks')
        .update(updates)
        .eq('id', networkId);

      if (error) {
        return {
          success: false,
          error: new Error(error.message),
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update office network'),
      };
    }
  },

  /**
   * Delete an office network
   */
  async deleteOfficeNetwork(networkId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await supabase
        .from('office_networks')
        .delete()
        .eq('id', networkId);

      if (error) {
        return {
          success: false,
          error: new Error(error.message),
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to delete office network'),
      };
    }
  },
};
