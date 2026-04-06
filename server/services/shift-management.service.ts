/**
 * Shift Management Service
 * Handles shift assignment and retrieval for employees
 */

import { supabase } from '../supabase/client';
import type { UserProfile } from '../types/profile';

export type ShiftType = 'morning' | 'evening';

export interface ShiftOption {
  id: ShiftType;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
}

export const SHIFT_OPTIONS: ShiftOption[] = [
  {
    id: 'morning',
    name: 'Morning Shift',
    startTime: '6:00 AM',
    endTime: '3:00 PM',
    description: '6:00 AM – 3:00 PM',
  },
  {
    id: 'evening',
    name: 'Evening Shift',
    startTime: '10:00 AM',
    endTime: '7:00 PM',
    description: '10:00 AM – 7:00 PM',
  },
];

export interface EmployeeShift {
  id: string;
  full_name: string;
  email: string;
  shift_type: ShiftType | null;
  office_name?: string;
  status: string;
}

export const shiftManagementService = {
  /**
   * Get all employees with their shift information
   */
  async getAllEmployeesWithShifts(): Promise<{
    employees: EmployeeShift[];
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, shift_type, office_location, status')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (error) throw error;

      return {
        employees: (data || []) as EmployeeShift[],
        error: null,
      };
    } catch (err) {
      return {
        employees: [],
        error: err instanceof Error ? err : new Error('Failed to fetch employees'),
      };
    }
  },

  /**
   * Assign shift to an employee
   */
  async assignShift(employeeId: string, shiftType: ShiftType): Promise<{
    success: boolean;
    message: string;
    error: Error | null;
  }> {
    try {
      // Validate shift type
      if (!['morning', 'evening'].includes(shiftType)) {
        throw new Error('Invalid shift type');
      }

      const { error } = await supabase
        .from('profiles')
        // @ts-ignore - Supabase type inference issue
        .update({ shift_type: shiftType })
        .eq('id', employeeId);

      if (error) throw error;

      return {
        success: true,
        message: `Shift assigned successfully`,
        error: null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign shift';
      return {
        success: false,
        message: errorMessage,
        error: err instanceof Error ? err : new Error(errorMessage),
      };
    }
  },

  /**
   * Get shift info for a specific employee
   */
  async getEmployeeShift(employeeId: string): Promise<{
    shift: ShiftOption | null;
    shiftType: ShiftType | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('shift_type')
        .eq('id', employeeId)
        .single() as any;

      if (error) throw error;

      if (!data) {
        throw new Error('Employee not found');
      }

      const shiftType = (data.shift_type as ShiftType) || 'evening';
      const shift = SHIFT_OPTIONS.find(s => s.id === shiftType) || SHIFT_OPTIONS[0];

      return {
        shift,
        shiftType,
        error: null,
      };
    } catch (err) {
      return {
        shift: null,
        shiftType: null,
        error: err instanceof Error ? err : new Error('Failed to get employee shift'),
      };
    }
  },

  /**
   * Get shift timing details
   */
  getShiftTiming(shiftType: ShiftType): { startTime: string; endTime: string } {
    const shift = SHIFT_OPTIONS.find(s => s.id === shiftType) || SHIFT_OPTIONS[0];
    
    // Convert to 24-hour format for calculations
    const startHour = shiftType === 'morning' ? 6 : 10;
    const endHour = shiftType === 'morning' ? 15 : 19; // 3 PM = 15, 7 PM = 19

    return {
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
    };
  },
};
