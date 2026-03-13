/**
 * Holiday Type Definitions
 * Types for holiday management system
 */

export type HolidayType = 'public_holiday' | 'festival' | 'company_event' | 'other';

export interface RecurringHoliday {
  id: string;
  employee_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  created_at: string;
  updated_at: string;
}

export interface SpecificHoliday {
  id: string;
  employee_id: string;
  holiday_date: string; // YYYY-MM-DD format
  holiday_type: HolidayType;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeHolidaySummary {
  employee_id: string;
  employee_name: string;
  recurring_holidays: number[]; // Array of day_of_week values
  specific_holidays: SpecificHoliday[];
}

export interface HolidayCalendarDay {
  date: string; // YYYY-MM-DD
  day_of_week: number;
  is_recurring_holiday: boolean;
  specific_holidays: SpecificHoliday[];
  employee_count: number; // Number of employees on holiday
}

export interface CreateRecurringHolidayRequest {
  employee_ids: string[];
  day_of_week: number;
}

export interface CreateSpecificHolidayRequest {
  employee_ids: string[];
  holiday_date: string;
  holiday_type: HolidayType;
  reason: string;
}

export interface DeleteHolidayRequest {
  holiday_id: string;
  holiday_category: 'recurring' | 'specific';
}

export interface EmployeeHolidayStatus {
  is_holiday: boolean;
  holiday_type: 'recurring' | 'specific' | null;
  reason: string | null;
}
