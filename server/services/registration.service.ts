/**
 * Registration Service
 * Handles employee registration workflow
 * Phase 2: Registration creates pending users who cannot login until approved
 */

import { supabase } from '../supabase/client';
import type { RegistrationData, RegistrationResponse } from '../types/registration';

export const registrationService = {
  /**
   * Register a new employee
   * Creates auth user, profile (status=pending), and employee_request
   * User CANNOT login until admin approves
   * 
   * @param data - Registration data (email, password, full_name, office_id)
   * @returns RegistrationResponse with success status
   */
  async registerEmployee(data: RegistrationData): Promise<RegistrationResponse> {
    try {
      const { email, password, full_name, office_id } = data;

      // Step 1: Create auth user using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
          },
        },
      });

      if (authError) {
        return {
          success: false,
          userId: null,
          error: new Error(authError.message),
        };
      }

      if (!authData.user) {
        return {
          success: false,
          userId: null,
          error: new Error('User creation failed'),
        };
      }

      const userId = authData.user.id;

      // Step 2: Create profile record with status = 'pending'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name,
          role: 'employee',
          status: 'pending', // ⚠️ User is pending approval
          office_location: office_id,
        });

      if (profileError) {
        // Rollback: Delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userId);
        return {
          success: false,
          userId: null,
          error: new Error(`Profile creation failed: ${profileError.message}`),
        };
      }

      // Step 3: Create employee_request record
      const { error: requestError } = await supabase
        .from('employee_requests')
        .insert({
          user_id: userId,
          full_name,
          email,
          office_id,
          status: 'pending',
        });

      if (requestError) {
        // Note: Profile already created, but request tracking failed
        // Admin can still manually approve via profile
        console.error('Employee request creation failed:', requestError);
      }

      // Step 4: Immediately sign out the user (they cannot login until approved)
      await supabase.auth.signOut();

      return {
        success: true,
        userId,
        error: null,
        message: 'Registration successful. Awaiting admin approval.',
      };
    } catch (err) {
      return {
        success: false,
        userId: null,
        error: err instanceof Error ? err : new Error('Registration failed'),
      };
    }
  },

  /**
   * Check if email is already registered
   * @param email - Email to check
   * @returns true if email exists
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      return !error && data !== null;
    } catch {
      return false;
    }
  },
};
