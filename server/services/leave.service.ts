import { supabaseAdmin } from '../supabase/client';
import { LeaveRequest, EmployeeLeaveBalance, LeaveType, LeavePolicy, LeaveAnalytics } from '../types/leave';
import { LeaveAnniversaryService } from './leave-anniversary.service';

export class LeaveService {
  // Get leave types
  static async getLeaveTypes(): Promise<LeaveType[]> {
    const { data, error } = await (supabaseAdmin as any)
      .from('leave_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Get employee leave balance for current employment year (with anniversary logic)
  static async getEmployeeLeaveBalance(employeeId: string, year: number = new Date().getFullYear()): Promise<EmployeeLeaveBalance[]> {
    try {
      // Check if anniversary passed and create new balance if needed
      await LeaveAnniversaryService.checkAndResetLeaveBalance(employeeId);

      // Get balance for current employment year using anniversary logic
      const data = await LeaveAnniversaryService.getCurrentYearBalance(employeeId);
      
      if (data && data.length > 0) {
        return data;
      }
      
      // If no balance exists, initialize it
      return await this.initializeLeaveBalance(employeeId, year);
    } catch (error) {
      console.error('[LeaveService] Error in getEmployeeLeaveBalance:', error);
      return [];
    }
  }

  // Initialize leave balance for employee with anniversary tracking
  static async initializeLeaveBalance(employeeId: string, year: number): Promise<EmployeeLeaveBalance[]> {
    try {
      // Get employee's enrollment date and calculate employment year
      const annoDate = new Date();
      annoDate.setFullYear(year);

      const employmentYear = LeaveAnniversaryService.calculateCurrentEmploymentYear(annoDate);
      const yearStartStr = LeaveAnniversaryService.formatDateForDB(employmentYear.start);
      const yearEndStr = LeaveAnniversaryService.formatDateForDB(employmentYear.end);

      // Get all leave types
      const { data: leaveTypes, error: typesError } = await (supabaseAdmin as any)
        .from('leave_types')
        .select('*');

      if (typesError) throw typesError;
      if (!leaveTypes || leaveTypes.length === 0) {
        return [];
      }

      const balances: any[] = [];
      
      // Create balance for each leave type
      for (const type of leaveTypes) {
        try {
          const { data: balance, error: insertError } = await (supabaseAdmin as any)
            .from('employee_leave_balance')
            .insert({
              employee_id: employeeId,
              leave_type_id: (type as any).id,
              total_leaves: (type as any).max_per_year,
              used_leaves: 0,
              remaining_leaves: (type as any).max_per_year,
              year: year,
              employment_year_start: yearStartStr,
              employment_year_end: yearEndStr,
            } as any)
            .select()
            .single();

          if (insertError) {
            // If duplicate, try to fetch existing
            if (insertError.code === 'PGRST116' || insertError.code === '23505') {
              const { data: existing } = await (supabaseAdmin as any)
                .from('employee_leave_balance')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('leave_type_id', (type as any).id)
                .eq('employment_year_start', yearStartStr)
                .single();
              
              if (existing) balances.push(existing);
            }
          } else if (balance) {
            balances.push(balance);
          }
        } catch (err) {
          console.error('[LeaveService] Error creating balance for type:', (type as any).name, err);
        }
      }

      return balances;
    } catch (error) {
      console.error('[LeaveService] Error in initializeLeaveBalance:', error);
      return [];
    }
  }

  // Get leave policies
  static async getLeavePolicies(): Promise<LeavePolicy[]> {
    const { data, error } = await (supabaseAdmin as any)
      .from('leave_policies')
      .select('*')
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  // Apply for leave
  static async applyForLeave(
    employeeId: string,
    leaveTypeId: string,
    startDate: string,
    endDate: string,
    reason: string,
    employeeGender?: string | null
  ): Promise<LeaveRequest> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if leave is backdated (start date is in the past)
    const isBackdated = start < today;

    // If backdated, enforce 30-day limit
    if (isBackdated) {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (start < thirtyDaysAgo) {
        throw new Error('You can only apply for leave from the last 30 days');
      }
    }

    if (end < start) {
      throw new Error('End date must be after start date');
    }

    // Validate "My Leave" eligibility
    const MY_LEAVE_ID = '55555555-5555-5555-5555-555555555555';
    if (leaveTypeId === MY_LEAVE_ID) {
      // Check if employee already has a "My Leave" in the current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthNum = now.getMonth() + 1;
      const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
      
      // Calculate last day of current month
      const lastDayOfMonth = new Date(currentYear, currentMonthNum, 0).getDate();
      const monthEnd = `${currentMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;
      
      const { data: monthlyLeaves, error: monthlyError } = await (supabaseAdmin as any)
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('status', 'approved')
        .gte('start_date', `${currentMonth}-01`)
        .lte('start_date', monthEnd);

      if (monthlyError) throw monthlyError;
      if (monthlyLeaves && monthlyLeaves.length >= 1) {
        throw new Error('You can only request one My Leave per calendar month');
      }
    }

    const { data: overlapping, error: overlapError } = await (supabaseAdmin as any)
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (overlapError) throw overlapError;
    if (overlapping && overlapping.length > 0) {
      throw new Error('You already have an approved leave during this period');
    }

    // Check anniversary and get current employment year balance
    await LeaveAnniversaryService.checkAndResetLeaveBalance(employeeId);
    const currentYear = await LeaveAnniversaryService.getCurrentEmploymentYear(employeeId);
    
    if (!currentYear) {
      throw new Error('Unable to determine employment year');
    }

    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('employee_leave_balance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('employment_year_start', currentYear.start)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

    const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (balance && (balance as any).remaining_leaves < leaveDays) {
      throw new Error(`Insufficient leave balance. Available: ${(balance as any).remaining_leaves} days`);
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'pending',
        is_backdated: isBackdated,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get employee's leave requests
  static async getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    console.log('[LeaveService] getEmployeeLeaveRequests called with employeeId:', employeeId);
    
    const { data, error } = await (supabaseAdmin as any)
      .from('leave_requests')
      .select(`*`)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    console.log('[LeaveService] Query result:', { data, error, count: data?.length });
    
    if (error) {
      console.error('[LeaveService] Error fetching leave requests:', error);
      throw error;
    }
    
    return data || [];
  }

  // Get employees on leave today
  static async getEmployeesOnLeaveToday(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await (supabaseAdmin as any)
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const employeeIds = [...new Set(((data as any) || []).map((r: any) => r.employee_id))];
      const { data: employees } = await (supabaseAdmin as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', employeeIds);

      if (employees) {
        const employeeMap = new Map((employees as any).map((e: any) => [e.id, e]));
        return (data as any).map((request: any) => ({
          ...request,
          employee: employeeMap.get(request.employee_id),
        }));
      }
    }

    return data || [];
  }

  // Admin: Get all leave requests
  static async getAllLeaveRequests(filters?: {
    status?: string;
    employeeId?: string;
  }): Promise<any[]> {
    let query = (supabaseAdmin as any)
      .from('leave_requests')
      .select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    // Order by start_date descending to show most recent leaves first
    // No limit - show full history
    const { data, error } = await query.order('start_date', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const employeeIds = [...new Set(((data as any) || []).map((r: any) => r.employee_id))];
      const { data: employees } = await (supabaseAdmin as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', employeeIds);

      const leaveTypeIds = [...new Set(((data as any) || []).map((r: any) => r.leave_type_id).filter(Boolean))];
      const { data: leaveTypes } = await (supabaseAdmin as any)
        .from('leave_types')
        .select('id, name')
        .in('id', leaveTypeIds);

      if (employees) {
        const employeeMap = new Map((employees as any).map((e: any) => [e.id, e]));
        const leaveTypeMap = new Map((leaveTypes || []).map((lt: any) => [lt.id, lt]));
        
        return data.map((request: any) => ({
          ...request,
          employee: employeeMap.get(request.employee_id),
          leave_type: leaveTypeMap.get(request.leave_type_id),
        }));
      }
    }

    return data || [];
  }

  // Admin: Approve leave request
  static async approveLeaveRequest(leaveRequestId: string, adminComment?: string): Promise<void> {
    const { data: leaveRequest, error: fetchError } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .single();

    if (fetchError) throw fetchError;
    if (!leaveRequest) throw new Error('Leave request not found');

    // My Leave validation - all employees can use it
    // Additional validation logic can be added here if needed

    const start = new Date((leaveRequest as any).start_date);
    const end = new Date((leaveRequest as any).end_date);
    const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log('[approveLeaveRequest] Approving leave request');
    console.log('[approveLeaveRequest] Leave days:', leaveDays);
    console.log('[approveLeaveRequest] Employee ID:', (leaveRequest as any).employee_id);
    console.log('[approveLeaveRequest] Leave Type ID:', (leaveRequest as any).leave_type_id);

    // Update request status
    const { error: updateError } = await (supabaseAdmin as any)
      .from('leave_requests')
      .update({
        status: 'approved',
        admin_comment: adminComment || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveRequestId);

    if (updateError) {
      console.error('[approveLeaveRequest] Failed to update request:', updateError);
      throw updateError;
    }

    // Update leave balance
    if ((leaveRequest as any).leave_type_id) {
      // Get the balance record
      const { data: balances, error: balanceError } = await (supabaseAdmin as any)
        .from('employee_leave_balance')
        .select('*')
        .eq('employee_id', (leaveRequest as any).employee_id)
        .eq('leave_type_id', (leaveRequest as any).leave_type_id);

      console.log('[approveLeaveRequest] Found balances:', balances?.length || 0);

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('[approveLeaveRequest] Balance fetch error:', balanceError);
        throw balanceError;
      }

      if (balances && balances.length > 0) {
        // Balance exists - UPDATE it
        const balance = balances[0] as any;
        const newUsedLeaves = (balance.used_leaves || 0) + leaveDays;
        const newRemainingLeaves = Math.max(0, (balance.total_leaves || 0) - newUsedLeaves);

        console.log('[approveLeaveRequest] Updating existing balance:', {
          balance_id: balance.id,
          old_used: balance.used_leaves,
          new_used: newUsedLeaves,
          old_remaining: balance.remaining_leaves,
          new_remaining: newRemainingLeaves,
          total: balance.total_leaves,
        });

        const { error: updateBalanceError } = await (supabaseAdmin as any)
          .from('employee_leave_balance')
          .update({
            used_leaves: newUsedLeaves,
            remaining_leaves: newRemainingLeaves,
            updated_at: new Date().toISOString(),
          })
          .eq('id', balance.id);

        if (updateBalanceError) {
          console.error('[approveLeaveRequest] Balance update error:', updateBalanceError);
          throw updateBalanceError;
        }

        console.log('[approveLeaveRequest] Balance updated successfully!');
      } else {
        // Balance doesn't exist - CREATE it
        console.log('[approveLeaveRequest] Balance not found, creating new balance record');
        
        // Get leave type to find max_per_year
        const { data: leaveType, error: ltError } = await supabaseAdmin
          .from('leave_types')
          .select('max_per_year')
          .eq('id', (leaveRequest as any).leave_type_id)
          .single();

        if (ltError || !leaveType) {
          console.error('[approveLeaveRequest] Leave type fetch error:', ltError);
          throw ltError || new Error('Leave type not found');
        }

        const totalLeaves = (leaveType as any).max_per_year || 12;
        const newRemainingLeaves = Math.max(0, totalLeaves - leaveDays);

        const { data: newBalance, error: insertError } = await (supabaseAdmin as any)
          .from('employee_leave_balance')
          .insert({
            employee_id: (leaveRequest as any).employee_id,
            leave_type_id: (leaveRequest as any).leave_type_id,
            total_leaves: totalLeaves,
            used_leaves: leaveDays,
            remaining_leaves: newRemainingLeaves,
            year: new Date().getFullYear(),
            employment_year_start: `${new Date().getFullYear()}-01-01`,
            employment_year_end: `${new Date().getFullYear()}-12-31`,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[approveLeaveRequest] Balance insert error:', insertError);
          throw insertError;
        }

        console.log('[approveLeaveRequest] New balance record created:', (newBalance as any)?.id);
      }
    }
  }

  // Admin: Reject leave request
  static async rejectLeaveRequest(leaveRequestId: string, adminComment: string): Promise<void> {
    const { error } = await (supabaseAdmin as any)
      .from('leave_requests')
      .update({
        status: 'rejected',
        admin_comment: adminComment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveRequestId);

    if (error) throw error;
  }

  // Admin: Get leave analytics
  static async getLeaveAnalytics(): Promise<LeaveAnalytics> {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { count: totalCount, error: totalError } = await supabaseAdmin
      .from('leave_requests')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount, error: pendingError } = await supabaseAdmin
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: todayCount, error: todayError } = await supabaseAdmin
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today);

    const { count: monthCount, error: monthError } = await supabaseAdmin
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('start_date', monthStartStr);

    if (totalError || pendingError || todayError || monthError) {
      throw new Error('Failed to fetch analytics');
    }

    return {
      total_requests: totalCount || 0,
      pending_requests: pendingCount || 0,
      employees_on_leave_today: todayCount || 0,
      leaves_this_month: monthCount || 0,
    };
  }

  /**
   * Recalculate leave balance for an employee based on actual approved leave requests
   * This should be called when leave requests are deleted or modified
   * @param employeeId - Employee ID
   * @returns Updated leave balances
   */
  static async recalculateLeaveBalance(employeeId: string): Promise<{ success: boolean; message: string; balances?: any[] }> {
    try {
      console.log('[LeaveService] Recalculating leave balance for employee:', employeeId);

      // Get current employment year dates
      console.log('[LeaveService] Getting current employment year...');
      const currentYearDates = await LeaveAnniversaryService.getCurrentEmploymentYear(employeeId);
      
      if (!currentYearDates) {
        console.error('[LeaveService] Could not determine employment year');
        return { success: false, message: 'Could not determine employment year for employee' };
      }

      console.log('[LeaveService] Employment year dates:', currentYearDates);

      // Calculate employment year number from start date
      const employmentYear = new Date(currentYearDates.start).getFullYear();
      console.log('[LeaveService] Employment year:', employmentYear);
      
      // Get all leave balances for current employment year
      console.log('[LeaveService] Fetching leave balances...');
      const { data: balances, error: balanceError } = await supabaseAdmin
        .from('employee_leave_balance')
        .select('*')
        .eq('employee_id', employeeId);

      if (balanceError) {
        console.error('[LeaveService] Error fetching balances:', balanceError);
        return { success: false, message: `Failed to fetch leave balances: ${balanceError.message}` };
      }

      console.log('[LeaveService] Found balances:', balances?.length || 0);

      if (!balances || balances.length === 0) {
        console.log('[LeaveService] No balances found, initializing...');
        try {
          const newBalances = await this.initializeLeaveBalance(employeeId, employmentYear);
          return { 
            success: true, 
            message: 'Leave balance initialized', 
            balances: newBalances 
          };
        } catch (initError: any) {
          console.error('[LeaveService] Error initializing balance:', initError);
          return { success: false, message: `Failed to initialize balance: ${initError.message}` };
        }
      }

      // For each leave type, recalculate used leaves based on approved requests
      const updatedBalances = [];
      
      for (const balance of balances) {
        const balanceRecord = balance as any;
        
        console.log('[LeaveService] Processing balance for leave type:', balanceRecord.leave_type_id);
        
        // Get all approved leave requests for this employee and leave type in current employment year
        // Use the employment year date range instead of calendar year
        const { data: approvedRequests, error: requestError } = await (supabaseAdmin as any)
          .from('leave_requests')
          .select('leave_days')
          .eq('employee_id', employeeId)
          .eq('leave_type_id', balanceRecord.leave_type_id)
          .eq('status', 'approved')
          .gte('created_at', currentYearDates.start)
          .lt('created_at', currentYearDates.end);

        if (requestError) {
          console.error('[LeaveService] Error fetching approved requests:', requestError);
          continue;
        }

        // Calculate total used leaves from approved requests
        const totalUsedLeaves = ((approvedRequests as any) || []).reduce((sum: number, req: any) => sum + ((req as any)?.leave_days || 0), 0);
        const newRemainingLeaves = Math.max(0, (balanceRecord.total_leaves || 0) - totalUsedLeaves);

        console.log('[LeaveService] Recalculating balance for leave type:', balanceRecord.leave_type_id, {
          date_range: `${currentYearDates.start} to ${currentYearDates.end}`,
          total_leaves: balanceRecord.total_leaves,
          old_used: balanceRecord.used_leaves,
          new_used: totalUsedLeaves,
          old_remaining: balanceRecord.remaining_leaves,
          new_remaining: newRemainingLeaves,
          approved_requests_count: approvedRequests?.length || 0,
          approved_requests: approvedRequests
        });

        // Only update if there's actually a change
        if (balanceRecord.used_leaves !== totalUsedLeaves || balanceRecord.remaining_leaves !== newRemainingLeaves) {
          console.log('[LeaveService] Balance needs update, updating...');
          
          // Update the balance record
          const { data: updatedBalance, error: updateError } = await (supabaseAdmin as any)
            .from('employee_leave_balance')
            .update({
              used_leaves: totalUsedLeaves,
              remaining_leaves: newRemainingLeaves,
              updated_at: new Date().toISOString(),
            })
            .eq('id', balanceRecord.id)
            .select()
            .single();

          if (updateError) {
            console.error('[LeaveService] Error updating balance:', updateError);
            continue;
          }

          updatedBalances.push(updatedBalance);
        } else {
          console.log('[LeaveService] Balance already correct, no update needed');
          updatedBalances.push(balanceRecord);
        }
      }

      console.log('[LeaveService] Successfully recalculated', updatedBalances.length, 'leave balances');
      
      return { 
        success: true, 
        message: `Recalculated ${updatedBalances.length} leave balances`, 
        balances: updatedBalances 
      };

    } catch (error: any) {
      console.error('[LeaveService] Unexpected error in recalculateLeaveBalance:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { 
        success: false, 
        message: `Failed to recalculate leave balance: ${error.message}` 
      };
    }
  }

  /**
   * Recalculate leave balance for all employees
   * Useful for admin when bulk operations are performed
   * @returns Summary of recalculation results
   */
  static async recalculateAllEmployeesBalance(): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      console.log('[LeaveService] Recalculating leave balance for all employees...');

      // Get all active employees
      const { data: employees, error: employeeError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee')
        .eq('status', 'active');

      if (employeeError) {
        console.error('[LeaveService] Error fetching employees:', employeeError);
        return { success: false, message: 'Failed to fetch employees' };
      }

      if (!employees || employees.length === 0) {
        return { success: true, message: 'No active employees found' };
      }

      const results: any[] = [];
      let successCount = 0;
      let failureCount = 0;

      // Recalculate balance for each employee
      for (const employee of employees) {
        try {
          const result = await this.recalculateLeaveBalance((employee as any).id);
          results.push({
            employeeId: (employee as any).id,
            employeeName: (employee as any).full_name,
            success: result.success,
            message: result.message
          });

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error('[LeaveService] Error recalculating for employee:', (employee as any).id, error);
          results.push({
            employeeId: (employee as any).id,
            employeeName: (employee as any).full_name,
            success: false,
            message: 'Unexpected error occurred'
          });
          failureCount++;
        }
      }

      console.log('[LeaveService] Bulk recalculation complete:', {
        total: employees.length,
        success: successCount,
        failures: failureCount
      });

      return {
        success: true,
        message: `Recalculated balance for ${successCount}/${employees.length} employees`,
        results
      };

    } catch (error) {
      console.error('[LeaveService] Error in recalculateAllEmployeesBalance:', error);
      return {
        success: false,
        message: 'Failed to recalculate leave balances'
      };
    }
  }
}
