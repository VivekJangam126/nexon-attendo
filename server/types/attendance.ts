/**
 * Attendance Types
 * Type definitions for attendance marking and validation
 */

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface Attendance {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  check_in_time: string; // ISO timestamp
  check_out_time: string | null;
  status: AttendanceStatus;
  office_id: string;
  latitude: number | null;
  longitude: number | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceResponse {
  success: boolean;
  attendance?: Attendance;
  error?: string;
  errorCode?: AttendanceErrorCode;
}

export interface TodayAttendanceResponse {
  attendance: Attendance | null;
  error: Error | null;
}

export type AttendanceErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_EMPLOYEE'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'NO_OFFICE_ASSIGNED'
  | 'NO_SHIFT_ASSIGNED'
  | 'ATTENDANCE_CLOSED'
  | 'ATTENDANCE_ALREADY_MARKED'
  | 'GPS_REQUIRED'
  | 'OUTSIDE_OFFICE_LOCATION'
  | 'OFFICE_WIFI_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'NOT_CHECKED_IN'
  | 'ALREADY_CHECKED_OUT'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AttendanceValidationError {
  success: false;
  error?: string;
  message?: string;
  errorCode: AttendanceErrorCode;
}

export interface AttendanceValidationSuccess {
  success: true;
  attendance: Attendance;
  message?: string;
  workHours?: number;
}

export type AttendanceResult = AttendanceValidationSuccess | AttendanceValidationError;
