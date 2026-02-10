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
  | 'OUTSIDE_TIME_WINDOW'
  | 'ATTENDANCE_ALREADY_MARKED'
  | 'VALIDATION_FAILED';

export interface AttendanceValidationError {
  success: false;
  error: string;
  errorCode: AttendanceErrorCode;
}

export interface AttendanceValidationSuccess {
  success: true;
  attendance: Attendance;
}

export type AttendanceResult = AttendanceValidationSuccess | AttendanceValidationError;
