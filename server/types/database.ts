/**
 * Database Type Definitions
 * Auto-generated types for Supabase tables
 * Phase 3: Added attendance table
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'employee' | 'admin'
          status: 'pending' | 'active' | 'rejected' | 'blocked'
          office_location: string | null
          designation: string | null
          role_type: 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'employee' | 'admin'
          status?: 'pending' | 'active' | 'rejected' | 'blocked'
          office_location?: string | null
          designation?: string | null
          role_type?: 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'employee' | 'admin'
          status?: 'pending' | 'active' | 'rejected' | 'blocked'
          office_location?: string | null
          designation?: string | null
          role_type?: 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern' | null
          created_at?: string
          updated_at?: string
        }
      }
      offices: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          country: string
          latitude: number | null
          longitude: number | null
          radius_in_meters: number
          wifi_ssids: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          country: string
          latitude?: number | null
          longitude?: number | null
          radius_in_meters?: number
          wifi_ssids?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          radius_in_meters?: number
          wifi_ssids?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      employee_requests: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          office_id: string
          status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email: string
          office_id: string
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string
          office_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          date: string
          check_in_time: string
          check_out_time: string | null
          status: 'present' | 'late' | 'absent'
          office_id: string
          latitude: number | null
          longitude: number | null
          ip_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          check_in_time: string
          check_out_time?: string | null
          status: 'present' | 'late' | 'absent'
          office_id: string
          latitude?: number | null
          longitude?: number | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          check_in_time?: string
          check_out_time?: string | null
          status?: 'present' | 'late' | 'absent'
          office_id?: string
          latitude?: number | null
          longitude?: number | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      office_networks: {
        Row: {
          id: string
          office_id: string
          network_name: string
          ip_range: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          network_name: string
          ip_range: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          network_name?: string
          ip_range?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attendance_settings: {
        Row: {
          id: string
          setting_name: string
          start_time: string
          end_time: string
          is_active: boolean
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_name: string
          start_time: string
          end_time: string
          is_active?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_name?: string
          start_time?: string
          end_time?: string
          is_active?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_recurring_holidays: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          created_at?: string
          updated_at?: string
        }
      }
      employee_specific_holidays: {
        Row: {
          id: string
          employee_id: string
          holiday_date: string
          holiday_type: 'public_holiday' | 'festival' | 'company_event' | 'other'
          reason: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          holiday_date: string
          holiday_type: 'public_holiday' | 'festival' | 'company_event' | 'other'
          reason: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          holiday_date?: string
          holiday_type?: 'public_holiday' | 'festival' | 'company_event' | 'other'
          reason?: string
          created_at?: string
          updated_at?: string
        }
      }
      master_public_holidays: {
        Row: {
          id: string
          holiday_date: string
          holiday_name: string
          holiday_type: 'national' | 'festival' | 'state' | 'optional'
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          holiday_date: string
          holiday_name: string
          holiday_type: 'national' | 'festival' | 'state' | 'optional'
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          holiday_date?: string
          holiday_name?: string
          holiday_type?: 'national' | 'festival' | 'state' | 'optional'
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_employee_holiday: {
        Args: {
          p_employee_id: string
          p_date: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
