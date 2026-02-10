/**
 * Server Module Exports
 * Central export point for all backend services and utilities
 * Phase 3: Added attendance marking service
 */

// Supabase Client
export { supabase } from './supabase/client';

// Services
export { authService } from './services/auth.service';
export { profileService } from './services/profile.service';
export { registrationService } from './services/registration.service';
export { officeService } from './services/office.service';
export { adminApprovalService } from './services/admin-approval.service';
export { attendanceService } from './services/attendance.service';

// Types
export type { Database } from './types/database';
export type { UserProfile, UserRole, UserStatus, ProfileResponse } from './types/profile';
export type { AuthSession, AuthResponse, SessionResponse, UserResponse } from './types/auth';
export type { RegistrationData, RegistrationResponse } from './types/registration';
export type { Office, OfficeResponse, OfficesListResponse } from './types/office';
export type {
  EmployeeRequest,
  EmployeeRequestWithOffice,
  RequestStatus,
  EmployeeRequestResponse,
  EmployeeRequestsListResponse,
  ApprovalResponse,
} from './types/employee-request';
export type {
  Attendance,
  AttendanceStatus,
  AttendanceResult,
  AttendanceResponse,
  TodayAttendanceResponse,
  AttendanceErrorCode,
} from './types/attendance';

// Configuration
export {
  ATTENDANCE_CONFIG,
  getCurrentISTTime,
  getTodayDateIST,
  isWithinAttendanceWindow,
  getAttendanceWindowString,
} from './config/attendance.config';

// Utilities
export {
  isSessionValid,
  isAuthenticated,
  getUserIdFromSession,
  getUserEmailFromSession,
} from './utils/session';

export {
  canAccessApp,
  isPending,
  isRejected,
  isBlocked,
  isAccessRestricted,
  isAdmin,
  isEmployee,
  getStatusText,
  getRoleText,
} from './utils/status';
