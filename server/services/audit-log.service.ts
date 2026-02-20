/**
 * Audit Log Service
 * Tracks all admin actions for security and compliance
 * Provides complete traceability of system changes
 */

import { supabase } from '../supabase/client';

export interface AuditLogParams {
  adminId: string;
  actionType: string;
  targetType: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent?: string;
}

export interface AuditLogResult {
  success: boolean;
  error?: string;
}

export const auditLogService = {
  /**
   * Log an admin action to audit trail
   * Does not block operation if logging fails (fail-safe)
   * 
   * @param params - Audit log parameters
   * @returns Success status
   */
  async log(params: AuditLogParams): Promise<AuditLogResult> {
    try {
      // Validate required fields
      if (!params.adminId) {
        console.error('❌ [AUDIT LOG] Missing admin ID');
        return { success: false, error: 'Missing admin ID' };
      }

      if (!params.actionType || params.actionType.trim() === '') {
        console.error('❌ [AUDIT LOG] Missing or empty action type');
        return { success: false, error: 'Missing action type' };
      }

      if (!params.targetType || params.targetType.trim() === '') {
        console.error('❌ [AUDIT LOG] Missing or empty target type');
        return { success: false, error: 'Missing target type' };
      }

      if (!params.ipAddress) {
        console.error('❌ [AUDIT LOG] Missing IP address (required for traceability)');
        return { success: false, error: 'Missing IP address' };
      }

      // Insert audit log record
      const { error } = await supabase.from('audit_logs').insert({
        admin_id: params.adminId,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId || null,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        ip_address: params.ipAddress,
        user_agent: params.userAgent || null,
      });

      if (error) {
        console.error('❌ [AUDIT LOG] Database error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AUDIT LOG] Logged:', {
        admin: params.adminId,
        action: params.actionType,
        target: params.targetType,
        targetId: params.targetId,
      });

      return { success: true };
    } catch (err) {
      console.error('❌ [AUDIT LOG] Exception:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Log employee approval action
   */
  async logEmployeeApproval(
    adminId: string,
    employeeId: string,
    oldStatus: string,
    newStatus: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'approve_employee',
      targetType: 'employee_request',
      targetId: employeeId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log employee rejection action
   */
  async logEmployeeRejection(
    adminId: string,
    employeeId: string,
    reason: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'reject_employee',
      targetType: 'employee_request',
      targetId: employeeId,
      oldValue: { status: 'pending' },
      newValue: { status: 'rejected', reason },
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log employee block/unblock action
   */
  async logEmployeeStatusChange(
    adminId: string,
    employeeId: string,
    oldStatus: string,
    newStatus: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: newStatus === 'blocked' ? 'block_employee' : 'unblock_employee',
      targetType: 'employee',
      targetId: employeeId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log attendance window change
   */
  async logAttendanceWindowChange(
    adminId: string,
    oldWindow: { start_time: string; end_time: string },
    newWindow: { start_time: string; end_time: string },
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'update_attendance_window',
      targetType: 'attendance_settings',
      oldValue: oldWindow,
      newValue: newWindow,
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log grace period change
   */
  async logGracePeriodChange(
    adminId: string,
    oldMinutes: number,
    newMinutes: number,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'update_grace_period',
      targetType: 'attendance_settings',
      oldValue: { grace_period_minutes: oldMinutes },
      newValue: { grace_period_minutes: newMinutes },
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log strict mode toggle
   */
  async logStrictModeChange(
    adminId: string,
    oldValue: boolean,
    newValue: boolean,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'toggle_strict_mode',
      targetType: 'attendance_settings',
      oldValue: { strict_mode: oldValue },
      newValue: { strict_mode: newValue },
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log office creation
   */
  async logOfficeCreation(
    adminId: string,
    officeId: string,
    officeData: any,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'create_office',
      targetType: 'office',
      targetId: officeId,
      newValue: officeData,
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log office update
   */
  async logOfficeUpdate(
    adminId: string,
    officeId: string,
    oldData: any,
    newData: any,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'update_office',
      targetType: 'office',
      targetId: officeId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log office deletion
   */
  async logOfficeDeletion(
    adminId: string,
    officeId: string,
    officeData: any,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'delete_office',
      targetType: 'office',
      targetId: officeId,
      oldValue: officeData,
      ipAddress,
      userAgent,
    });
  },

  /**
   * Log employee deletion
   */
  async logEmployeeDeletion(
    adminId: string,
    employeeId: string,
    employeeData: any,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuditLogResult> {
    return this.log({
      adminId,
      actionType: 'delete_employee',
      targetType: 'employee',
      targetId: employeeId,
      oldValue: employeeData,
      ipAddress,
      userAgent,
    });
  },
};
