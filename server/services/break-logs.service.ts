/**
 * Break Logs Service
 * Handles employee break tracking (tea breaks)
 */

import { supabase } from '../supabase/client';

export interface BreakLog {
  id: string;
  employee_id: string;
  break_type: 'tea';
  start_time: string;
  end_time: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BreakLogResult {
  success: boolean;
  breakLog?: BreakLog;
  error?: string;
}

export interface BreakLogsResponse {
  breakLogs: BreakLog[];
  error: Error | null;
}

export const breakLogsService = {
  /**
   * Get today's break logs for an employee
   */
  async getTodayBreakLogs(employeeId: string): Promise<BreakLogsResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('break_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('start_time', `${today}T00:00:00.000Z`)
        .lt('start_time', `${today}T23:59:59.999Z`)
        .order('start_time', { ascending: true });

      if (error) {
        return {
          breakLogs: [],
          error: new Error(error.message),
        };
      }

      return {
        breakLogs: (data || []) as BreakLog[],
        error: null,
      };
    } catch (err) {
      return {
        breakLogs: [],
        error: err instanceof Error ? err : new Error('Failed to fetch break logs'),
      };
    }
  },

  /**
   * Start a tea break for an employee
   */
  async startBreak(
    employeeId: string, 
    createdBy: string,
    breakType: 'tea' = 'tea'
  ): Promise<BreakLogResult> {
    try {
      // Check if there's already an active break
      const { data: activeBreak } = await supabase
        .from('break_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .is('end_time', null)
        .single();

      if (activeBreak) {
        return {
          success: false,
          error: 'Employee already has an active break',
        };
      }

      // Create new break log
      const { data, error } = await supabase
        .from('break_logs')
        .insert({
          employee_id: employeeId,
          break_type: breakType,
          start_time: new Date().toISOString(),
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        breakLog: data as BreakLog,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to start break',
      };
    }
  },

  /**
   * End an active break for an employee
   */
  async endBreak(employeeId: string): Promise<BreakLogResult> {
    try {
      // Find the active break
      const { data: activeBreak, error: findError } = await supabase
        .from('break_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .is('end_time', null)
        .single();

      if (findError || !activeBreak) {
        return {
          success: false,
          error: 'No active break found',
        };
      }

      // Update the break with end time
      const { data, error } = await supabase
        .from('break_logs')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', activeBreak.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        breakLog: data as BreakLog,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to end break',
      };
    }
  },

  /**
   * Get current active break for an employee
   */
  async getActiveBreak(employeeId: string): Promise<{
    activeBreak: BreakLog | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('break_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return {
          activeBreak: null,
          error: new Error(error.message),
        };
      }

      return {
        activeBreak: data as BreakLog | null,
        error: null,
      };
    } catch (err) {
      return {
        activeBreak: null,
        error: err instanceof Error ? err : new Error('Failed to get active break'),
      };
    }
  },

  /**
   * Get break logs for a date range (for reporting)
   */
  async getBreakLogsForDateRange(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<BreakLogsResponse> {
    try {
      const { data, error } = await supabase
        .from('break_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('start_time', `${startDate}T00:00:00.000Z`)
        .lte('start_time', `${endDate}T23:59:59.999Z`)
        .order('start_time', { ascending: true });

      if (error) {
        return {
          breakLogs: [],
          error: new Error(error.message),
        };
      }

      return {
        breakLogs: (data || []) as BreakLog[],
        error: null,
      };
    } catch (err) {
      return {
        breakLogs: [],
        error: err instanceof Error ? err : new Error('Failed to fetch break logs'),
      };
    }
  },

  /**
   * Get break statistics for an employee
   */
  async getBreakStats(employeeId: string, date: string): Promise<{
    totalBreaks: number;
    totalBreakTime: number; // in minutes
    averageBreakTime: number; // in minutes
    error: Error | null;
  }> {
    try {
      const { breakLogs, error } = await this.getBreakLogsForDateRange(
        employeeId,
        date,
        date
      );

      if (error) {
        return {
          totalBreaks: 0,
          totalBreakTime: 0,
          averageBreakTime: 0,
          error,
        };
      }

      const completedBreaks = breakLogs.filter(log => log.end_time);
      const totalBreaks = completedBreaks.length;
      
      let totalBreakTime = 0;
      completedBreaks.forEach(log => {
        if (log.end_time) {
          const start = new Date(log.start_time);
          const end = new Date(log.end_time);
          totalBreakTime += (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
        }
      });

      const averageBreakTime = totalBreaks > 0 ? totalBreakTime / totalBreaks : 0;

      return {
        totalBreaks,
        totalBreakTime: Math.round(totalBreakTime),
        averageBreakTime: Math.round(averageBreakTime),
        error: null,
      };
    } catch (err) {
      return {
        totalBreaks: 0,
        totalBreakTime: 0,
        averageBreakTime: 0,
        error: err instanceof Error ? err : new Error('Failed to calculate break stats'),
      };
    }
  },
};