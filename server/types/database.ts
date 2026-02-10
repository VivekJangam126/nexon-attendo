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
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
