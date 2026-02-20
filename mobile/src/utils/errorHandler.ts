/**
 * Error Handler Utilities
 * Maps backend error codes to user-friendly messages
 */

import { AttendanceErrorCode } from '../types/attendance';

export const getErrorMessage = (errorCode?: AttendanceErrorCode, customMessage?: string): string => {
  if (customMessage) return customMessage;
  
  switch (errorCode) {
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment and try again.';
    
    case 'ATTENDANCE_ALREADY_MARKED':
      return 'You have already marked attendance for today.';
    
    case 'OUTSIDE_OFFICE_LOCATION':
      return 'You are outside the office premises. Please move closer to the office location.';
    
    case 'GPS_REQUIRED':
      return 'Location permission is required to mark attendance. Please enable location services.';
    
    case 'ATTENDANCE_CLOSED':
      return 'Attendance window is currently closed. Please check the attendance timings.';
    
    case 'UNAUTHORIZED':
      return 'You are not authorized. Please log in again.';
    
    case 'NOT_EMPLOYEE':
      return 'Only employees can mark attendance.';
    
    case 'ACCOUNT_NOT_ACTIVE':
      return 'Your account is not active. Please contact HR.';
    
    case 'NO_OFFICE_ASSIGNED':
      return 'No office location assigned. Please contact admin.';
    
    case 'VALIDATION_FAILED':
    default:
      return 'Failed to mark attendance. Please try again.';
  }
};

export const getErrorTitle = (errorCode?: AttendanceErrorCode): string => {
  switch (errorCode) {
    case 'RATE_LIMITED':
      return 'Too Many Requests';
    
    case 'ATTENDANCE_ALREADY_MARKED':
      return 'Already Marked';
    
    case 'OUTSIDE_OFFICE_LOCATION':
      return 'Outside Office';
    
    case 'GPS_REQUIRED':
      return 'Location Required';
    
    case 'ATTENDANCE_CLOSED':
      return 'Window Closed';
    
    case 'UNAUTHORIZED':
      return 'Not Authorized';
    
    case 'NOT_EMPLOYEE':
      return 'Access Denied';
    
    case 'ACCOUNT_NOT_ACTIVE':
      return 'Account Inactive';
    
    case 'NO_OFFICE_ASSIGNED':
      return 'No Office';
    
    case 'VALIDATION_FAILED':
    default:
      return 'Error';
  }
};
