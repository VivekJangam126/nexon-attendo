/**
 * Holiday Service
 * Manages recurring and specific holidays for employees
 * Integrates with attendance system to prevent marking absent on holidays
 */

import { supabase } from '../supabase/client';
import type {
  RecurringHoliday,
  SpecificHoliday,
  EmployeeHolidaySummary,
  CreateRecurringHolidayRequest,
  CreateSpecificHolidayRequest,
  EmployeeHolidayStatus,
  HolidayType,
} from '../types/holiday';

export const holidayService = {
  /**
   * Check if a specific date is a holiday for an employee
   * Uses database function for efficient checking
   */
  async isEmployeeHoliday(
    employeeId: string,
    date: string // YYYY-MM-DD format
  ): Promise<EmployeeHolidayStatus> {
    try {
      // Call database function
      const { data, error } = await supabase.rpc('is_employee_holiday', {
        p_employee_id: employeeId,
        p_date: date,
      });

      if (error) {
        console.error('Error checking holiday:', error);
        return { is_holiday: false, holiday_type: null, reason: null };
      }

      if (!data) {
        return { is_holiday: false, holiday_type: null, reason: null };
      }

      // Get holiday details
      const dayOfWeek = new Date(date).getDay();
      
      // Check recurring holiday
      const { data: recurringHoliday } = await supabase
        .from('employee_recurring_holidays')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();

      if (recurringHoliday) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
          is_holiday: true,
          holiday_type: 'recurring',
          reason: `Weekly holiday (${dayNames[dayOfWeek]})`,
        };
      }

      // Check specific holiday
      const { data: specificHoliday } = await supabase
        .from('employee_specific_holidays')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('holiday_date', date)
        .maybeSingle();

      if (specificHoliday) {
        return {
          is_holiday: true,
          holiday_type: 'specific',
          reason: (specificHoliday as SpecificHoliday).reason,
        };
      }

      return { is_holiday: false, holiday_type: null, reason: null };
    } catch (err) {
      console.error('Exception in isEmployeeHoliday:', err);
      return { is_holiday: false, holiday_type: null, reason: null };
    }
  },

  /**
   * Create recurring holidays for multiple employees
   * Admin only
   */
  async createRecurringHolidays(
    request: CreateRecurringHolidayRequest
  ): Promise<{ success: boolean; error: string | null; count: number }> {
    try {
      const { employee_ids, day_of_week } = request;

      if (!employee_ids || employee_ids.length === 0) {
        return { success: false, error: 'No employees selected', count: 0 };
      }

      if (day_of_week < 0 || day_of_week > 6) {
        return { success: false, error: 'Invalid day of week', count: 0 };
      }

      // Create holiday records for each employee
      const records = employee_ids.map(employee_id => ({
        employee_id,
        day_of_week,
      }));

      const { data, error } = await supabase
        .from('employee_recurring_holidays')
        .upsert(records, { onConflict: 'employee_id,day_of_week' })
        .select();

      if (error) {
        console.error('Error creating recurring holidays:', error);
        return { success: false, error: error.message, count: 0 };
      }

      return { success: true, error: null, count: data?.length || 0 };
    } catch (err) {
      console.error('Exception in createRecurringHolidays:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create holidays',
        count: 0,
      };
    }
  },

  /**
   * Create specific date holidays for multiple employees
   * Admin only
   */
  async createSpecificHolidays(
    request: CreateSpecificHolidayRequest
  ): Promise<{ success: boolean; error: string | null; count: number }> {
    try {
      const { employee_ids, holiday_date, holiday_type, reason } = request;

      if (!employee_ids || employee_ids.length === 0) {
        return { success: false, error: 'No employees selected', count: 0 };
      }

      if (!holiday_date || !reason) {
        return { success: false, error: 'Missing required fields', count: 0 };
      }

      // Create holiday records for each employee
      const records = employee_ids.map(employee_id => ({
        employee_id,
        holiday_date,
        holiday_type,
        reason,
      }));

      const { data, error } = await supabase
        .from('employee_specific_holidays')
        .upsert(records, { onConflict: 'employee_id,holiday_date' })
        .select();

      if (error) {
        console.error('Error creating specific holidays:', error);
        return { success: false, error: error.message, count: 0 };
      }

      return { success: true, error: null, count: data?.length || 0 };
    } catch (err) {
      console.error('Exception in createSpecificHolidays:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create holidays',
        count: 0,
      };
    }
  },

  /**
   * Delete recurring holiday
   * Admin only
   */
  async deleteRecurringHoliday(
    holidayId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('employee_recurring_holidays')
        .delete()
        .eq('id', holidayId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete holiday',
      };
    }
  },

  /**
   * Delete specific holiday
   * Admin only
   */
  async deleteSpecificHoliday(
    holidayId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('employee_specific_holidays')
        .delete()
        .eq('id', holidayId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete holiday',
      };
    }
  },

  /**
   * Get all recurring holidays
   * Admin only
   */
  async getAllRecurringHolidays(): Promise<{
    holidays: RecurringHoliday[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('employee_recurring_holidays')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) {
        return { holidays: [], error: error.message };
      }

      return { holidays: (data || []) as RecurringHoliday[], error: null };
    } catch (err) {
      return {
        holidays: [],
        error: err instanceof Error ? err.message : 'Failed to fetch holidays',
      };
    }
  },

  /**
   * Get all specific holidays
   * Admin only - can filter by date range
   */
  async getAllSpecificHolidays(
    startDate?: string,
    endDate?: string
  ): Promise<{
    holidays: SpecificHoliday[];
    error: string | null;
  }> {
    try {
      let query = supabase
        .from('employee_specific_holidays')
        .select('*')
        .order('holiday_date', { ascending: true });

      if (startDate) {
        query = query.gte('holiday_date', startDate);
      }

      if (endDate) {
        query = query.lte('holiday_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { holidays: [], error: error.message };
      }

      return { holidays: (data || []) as SpecificHoliday[], error: null };
    } catch (err) {
      return {
        holidays: [],
        error: err instanceof Error ? err.message : 'Failed to fetch holidays',
      };
    }
  },

  /**
   * Get employee's recurring holidays
   */
  async getEmployeeRecurringHolidays(
    employeeId: string
  ): Promise<{
    holidays: RecurringHoliday[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('employee_recurring_holidays')
        .select('*')
        .eq('employee_id', employeeId)
        .order('day_of_week', { ascending: true });

      if (error) {
        return { holidays: [], error: error.message };
      }

      return { holidays: (data || []) as RecurringHoliday[], error: null };
    } catch (err) {
      return {
        holidays: [],
        error: err instanceof Error ? err.message : 'Failed to fetch holidays',
      };
    }
  },

  /**
   * Get employee's specific holidays
   */
  async getEmployeeSpecificHolidays(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    holidays: SpecificHoliday[];
    error: string | null;
  }> {
    try {
      let query = supabase
        .from('employee_specific_holidays')
        .select('*')
        .eq('employee_id', employeeId)
        .order('holiday_date', { ascending: true });

      if (startDate) {
        query = query.gte('holiday_date', startDate);
      }

      if (endDate) {
        query = query.lte('holiday_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { holidays: [], error: error.message };
      }

      return { holidays: (data || []) as SpecificHoliday[], error: null };
    } catch (err) {
      return {
        holidays: [],
        error: err instanceof Error ? err.message : 'Failed to fetch holidays',
      };
    }
  },

  /**
   * Get holidays for a specific date (all employees)
   * Admin only - used for calendar view
   */
  async getHolidaysByDate(
    date: string
  ): Promise<{
    employees: Array<{ id: string; name: string; reason: string }>;
    error: string | null;
  }> {
    try {
      const dayOfWeek = new Date(date).getDay();
      const employees: Array<{ id: string; name: string; reason: string }> = [];

      // Get employees with recurring holiday on this day
      const { data: recurringData, error: recurringError } = await supabase
        .from('employee_recurring_holidays')
        .select('employee_id, profiles!inner(id, full_name)')
        .eq('day_of_week', dayOfWeek);

      if (!recurringError && recurringData) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        recurringData.forEach((item: any) => {
          employees.push({
            id: item.employee_id,
            name: item.profiles.full_name,
            reason: `Weekly holiday (${dayNames[dayOfWeek]})`,
          });
        });
      }

      // Get employees with specific holiday on this date
      const { data: specificData, error: specificError } = await supabase
        .from('employee_specific_holidays')
        .select('employee_id, reason, profiles!inner(id, full_name)')
        .eq('holiday_date', date);

      if (!specificError && specificData) {
        specificData.forEach((item: any) => {
          // Avoid duplicates
          if (!employees.find(e => e.id === item.employee_id)) {
            employees.push({
              id: item.employee_id,
              name: item.profiles.full_name,
              reason: item.reason,
            });
          }
        });
      }

      return { employees, error: null };
    } catch (err) {
      return {
        employees: [],
        error: err instanceof Error ? err.message : 'Failed to fetch holidays',
      };
    }
  },

  /**
   * Delete all recurring holidays for a specific day
   * Admin only - used when removing a day from holiday calendar
   */
  async deleteRecurringHolidaysByDay(
    dayOfWeek: number
  ): Promise<{ success: boolean; error: string | null; count: number }> {
    try {
      const { data, error } = await supabase
        .from('employee_recurring_holidays')
        .delete()
        .eq('day_of_week', dayOfWeek)
        .select();

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }

      return { success: true, error: null, count: data?.length || 0 };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete holidays',
        count: 0,
      };
    }
  },

  /**
   * Delete all specific holidays for a specific date
   * Admin only - used when removing a date from holiday calendar
   */
  async deleteSpecificHolidaysByDate(
    date: string
  ): Promise<{ success: boolean; error: string | null; count: number }> {
    try {
      const { data, error } = await supabase
        .from('employee_specific_holidays')
        .delete()
        .eq('holiday_date', date)
        .select();

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }

      return { success: true, error: null, count: data?.length || 0 };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete holidays',
        count: 0,
      };
    }
  },
};
