/**
 * Office Types
 */

export interface Office {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radius_in_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
