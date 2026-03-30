import { supabaseAdmin } from '../supabase/client';
import { LeaveService } from './leave.service';

/**
 * Leave Anniversary Service
 * Handles automatic leave balance reset on employment anniversary
 * Ensures employees get fresh leave allocation every year on their enrollment anniversary
 */
export class LeaveAnniversaryService {
  /**
   * Calculate employment anniversary dates
   * @param enrollmentDate - Date employee was created/enrolled
   * @returns Object with current employment year start and end dates
   */
  static calculateCurrentEmploymentYear(enrollmentDate: Date) {
    const enrollment = new Date(enrollmentDate);
    enrollment.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent anniversary
    let anniversaryStart = new Date(enrollment);
    let anniversaryEnd = new Date(enrollment);
    anniversaryEnd.setFullYear(anniversaryEnd.getFullYear() + 1);

    // Keep incrementing until we find the current employment year
    while (anniversaryEnd <= today) {
      anniversaryStart = new Date(anniversaryEnd);
      anniversaryEnd = new Date(anniversaryEnd);
      anniversaryEnd.setFullYear(anniversaryEnd.getFullYear() + 1);
    }

    return {
      start: anniversaryStart,
      end: anniversaryEnd,
    };
  }

  /**
   * Format date to YYYY-MM-DD string for database
   */
  static formatDateForDB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if employee's anniversary has passed and create new balance if needed
   * @param employeeId - Employee ID
   * @returns true if new balance was created, false if balance already exists
   */
  static async checkAndResetLeaveBalance(employeeId: string): Promise<boolean> {
    try {
      console.log('[LeaveAnniversaryService] Checking anniversary for employee:', employeeId);

      // Get employee's enrollment date
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('created_at, full_name')
        .eq('id', employeeId)
        .single() as any;

      if (profileError || !profile) {
        console.error('[LeaveAnniversaryService] Employee not found:', profileError);
        throw new Error('Employee not found');
      }

      const enrollmentDate = new Date(profile.created_at);
      console.log('[LeaveAnniversaryService] Employee:', profile.full_name, 'Enrolled:', enrollmentDate);

      // Calculate current employment year
      const currentYear = this.calculateCurrentEmploymentYear(enrollmentDate);
      const yearStartStr = this.formatDateForDB(currentYear.start);
      const yearEndStr = this.formatDateForDB(currentYear.end);

      console.log('[LeaveAnniversaryService] Current employment year:', yearStartStr, 'to', yearEndStr);

      // Check if balance already exists for current employment year
      const { data: existingBalance, error: balanceError } = await supabaseAdmin
        .from('employee_leave_balance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('employment_year_start', yearStartStr)
        .single();

      if (!balanceError && existingBalance) {
        console.log('[LeaveAnniversaryService] Balance already exists for current year');
        return false; // Balance already exists
      }

      console.log('[LeaveAnniversaryService] Creating new balance for current employment year');

      // Get all leave types
      const { data: leaveTypes, error: typesError } = await supabaseAdmin
        .from('leave_types')
        .select('*') as any;

      if (typesError || !leaveTypes) {
        console.error('[LeaveAnniversaryService] Error fetching leave types:', typesError);
        throw typesError;
      }

      // Create new balance for each leave type
      for (const type of leaveTypes) {
        const { error: insertError } = await (supabase as any)
          .from('employee_leave_balance')
          .insert({
            employee_id: employeeId,
            leave_type_id: type.id,
            total_leaves: type.max_per_year,
            used_leaves: 0,
            remaining_leaves: type.max_per_year,
            employment_year_start: yearStartStr,
            employment_year_end: yearEndStr,
          });

        if (insertError) {
          console.error('[LeaveAnniversaryService] Error creating balance for type', type.name, ':', insertError);
          // Continue with other types even if one fails
        } else {
          console.log('[LeaveAnniversaryService] Created balance for', type.name);
        }
      }

      return true; // New balance created
    } catch (error) {
      console.error('[LeaveAnniversaryService] Error in checkAndResetLeaveBalance:', error);
      return false;
    }
  }

  /**
   * Get employee's current employment year
   * @param employeeId - Employee ID
   * @returns Object with start and end dates, or null if employee not found
   */
  static async getCurrentEmploymentYear(employeeId: string): Promise<{ start: string; end: string } | null> {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('created_at')
        .eq('id', employeeId)
        .single() as any;

      if (error || !profile) {
        return null;
      }

      const enrollmentDate = new Date(profile.created_at);
      const currentYear = this.calculateCurrentEmploymentYear(enrollmentDate);

      return {
        start: this.formatDateForDB(currentYear.start),
        end: this.formatDateForDB(currentYear.end),
      };
    } catch (error) {
      console.error('[LeaveAnniversaryService] Error getting current employment year:', error);
      return null;
    }
  }

  /**
   * Get all leave balances for current employment year
   * @param employeeId - Employee ID
   * @returns Array of leave balances
   */
  static async getCurrentYearBalance(employeeId: string): Promise<any[]> {
    try {
      const currentYear = await this.getCurrentEmploymentYear(employeeId);
      
      if (!currentYear) {
        return [];
      }

      const { data, error } = await supabaseAdmin
        .from('employee_leave_balance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('employment_year_start', currentYear.start) as any;

      if (error) {
        console.error('[LeaveAnniversaryService] Error fetching balance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[LeaveAnniversaryService] Error in getCurrentYearBalance:', error);
      return [];
    }
  }

  /**
   * Get all leave balances for an employee (all years)
   * Useful for historical/reporting purposes
   * @param employeeId - Employee ID
   * @returns Array of all leave balances
   */
  static async getAllYearsBalance(employeeId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('employee_leave_balance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('employment_year_start', { ascending: false }) as any;

      if (error) {
        console.error('[LeaveAnniversaryService] Error fetching all balances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[LeaveAnniversaryService] Error in getAllYearsBalance:', error);
      return [];
    }
  }
}
