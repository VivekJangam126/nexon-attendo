/**
 * Office Types
 * Type definitions for office locations
 */

export interface Office {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  wifi_ssids: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeNetwork {
  id: string;
  office_id: string;
  network_name: string;
  ip_range: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeResponse {
  office: Office | null;
  error: Error | null;
}

export interface OfficesListResponse {
  offices: Office[];
  error: Error | null;
}
