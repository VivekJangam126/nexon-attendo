/**
 * Attendance Settings Types
 */

export interface AttendanceWindow {
  id: string;
  setting_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  is_active: boolean;
  strict_mode: boolean; // If true, GPS/WiFi verification required
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWindowResponse {
  window: AttendanceWindow | null;
  error: Error | null;
}

export interface UpdateWindowResponse {
  success: boolean;
  error: Error | null;
}

export interface WindowCheckResponse {
  isOpen: boolean;
  window: AttendanceWindow | null;
  error: Error | null;
}
