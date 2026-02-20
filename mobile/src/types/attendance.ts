/**
 * Attendance Types
 */

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface Attendance {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  check_in_time: string; // ISO timestamp
  check_out_time: string | null;
  status: AttendanceStatus;
  office_id: string;
  latitude: number | null;
  longitude: number | null;
  ip_address: string | null;
  device_id: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_EMPLOYEE'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'NO_OFFICE_ASSIGNED'
  | 'ATTENDANCE_CLOSED'
  | 'ATTENDANCE_ALREADY_MARKED'
  | 'GPS_REQUIRED'
  | 'OUTSIDE_OFFICE_LOCATION'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED';

export interface AttendanceResult {
  success: boolean;
  attendance?: Attendance;
  error?: string;
  errorCode?: AttendanceErrorCode;
}

export interface AttendanceWindow {
  id: string;
  setting_name: string;
  start_time: string; // HH:MM:SS
  end_time: string;
  grace_period_minutes: number;
  is_active: boolean;
  strict_mode: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
