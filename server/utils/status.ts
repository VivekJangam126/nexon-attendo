/**
 * Status Utilities
 * Helper functions for user status and role awareness
 * Phase 1: Backend readiness only - no UI logic
 */

import type { UserProfile, UserStatus, UserRole } from '../types/profile';

/**
 * Check if user can access the application
 * Only 'active' users have full access
 * @param profile - User profile
 * @returns true if user status is 'active'
 */
export function canAccessApp(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.status === 'active';
}

/**
 * Check if user is pending approval
 * @param profile - User profile
 * @returns true if user status is 'pending'
 */
export function isPending(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.status === 'pending';
}

/**
 * Check if user is rejected
 * @param profile - User profile
 * @returns true if user status is 'rejected'
 */
export function isRejected(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.status === 'rejected';
}

/**
 * Check if user is blocked
 * @param profile - User profile
 * @returns true if user status is 'blocked'
 */
export function isBlocked(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.status === 'blocked';
}

/**
 * Check if user has restricted access (rejected or blocked)
 * @param profile - User profile
 * @returns true if user is rejected or blocked
 */
export function isAccessRestricted(profile: UserProfile | null): boolean {
  return isRejected(profile) || isBlocked(profile);
}

/**
 * Check if user is an admin
 * @param profile - User profile
 * @returns true if user role is 'admin'
 */
export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.role === 'admin';
}

/**
 * Check if user is an employee
 * @param profile - User profile
 * @returns true if user role is 'employee'
 */
export function isEmployee(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.role === 'employee';
}

/**
 * Get human-readable status text
 * @param status - User status
 * @returns Display text for status
 */
export function getStatusText(status: UserStatus): string {
  const statusMap: Record<UserStatus, string> = {
    pending: 'Pending Approval',
    active: 'Active',
    rejected: 'Rejected',
    blocked: 'Blocked',
  };
  return statusMap[status];
}

/**
 * Get human-readable role text
 * @param role - User role
 * @returns Display text for role
 */
export function getRoleText(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    admin: 'Administrator',
    employee: 'Employee',
  };
  return roleMap[role];
}
