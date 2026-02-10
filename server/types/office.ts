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
  wifi_ssids: string[] | null;
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
