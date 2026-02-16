/**
 * Server Module Exports
 * Central export point for all backend services and utilities
 * Phase 3: Added attendance marking service
 * CRITICAL: Attendance window now comes from database, not hardcoded
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
export { attendanceSettingsService } from './services/attendance-settings.service';
export { officeNetworkService } from './services/office-network.service';
export { employeeService } from './services/employee.service';
export { dashboardService } from './services/dashboard.service';
export { reportsService } from './services/reports.service';
export { notificationSettingsService } from './services/notification-settings.service';
export { notificationTriggerService } from './services/notification-trigger.service';
// NOTE: notificationService is NOT exported here to avoid bundling Node.js-only packages (Twilio)
// Import it directly in backend scripts: import { notificationService } from './server/services/notification.service';

// Types
export type { Database } from './types/database';
export type { UserProfile, UserRole, UserStatus, ProfileResponse } from './types/profile';
export type { AuthSession, AuthResponse, SessionResponse, UserResponse } from './types/auth';
export type { RegistrationData, RegistrationResponse } from './types/registration';
export type { Office, OfficeNetwork, OfficeResponse, OfficesListResponse } from './types/office';
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
export type {
  AttendanceWindow,
  AttendanceWindowResponse,
  UpdateWindowResponse,
  WindowCheckResponse,
} from './types/attendance-settings';

// Employee & Dashboard Types
export type {
  EmployeeWithAttendance,
  EmployeeDetailResponse,
} from './services/employee.service';

export type {
  DashboardStats,
  RecentActivity,
  PendingAction,
} from './services/dashboard.service';

export type {
  ReportStats,
  DailyBreakdown,
  EmployeeAttendanceRecord,
} from './services/reports.service';

export type {
  NotificationSlot,
  NotificationContact,
  NotificationHistoryRecord,
} from './services/notification-settings.service';

// NOTE: Notification types are NOT exported to avoid bundling Node.js-only packages
// Import directly in backend: import type { AttendanceNotificationData } from './server/services/notification.service';

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
