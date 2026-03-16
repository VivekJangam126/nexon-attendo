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
   * SINGLE OFFICE MODE: Auto-assigns to SmartMatrix Pvt Ltd
   * 
   * @param data - Registration data (email, password, full_name, office_id - ignored in single office mode)
   * @returns RegistrationResponse with success status
   */
  async registerEmployee(data: RegistrationData): Promise<RegistrationResponse> {
    try {
      const { email, password, full_name, office_id, designation, role_type, profile_photo, profile_photo_url } = data;

      console.log('🔍 [REGISTRATION] Starting employee registration...');
      console.log('  Email:', email);
      console.log('  Office ID:', office_id);
      console.log('  Designation:', designation);
      console.log('  Role Type:', role_type);
      console.log('  Profile Photo File:', profile_photo ? 'Provided' : 'Not provided');
      console.log('  Profile Photo URL:', profile_photo_url ? 'Provided' : 'Not provided');

      // Verify the selected office exists and is active
      const { data: selectedOffice, error: officeError } = await supabase
        .from('offices')
        .select('id, name')
        .eq('id', office_id)
        .eq('is_active', true)
        .single();

      if (officeError || !selectedOffice) {
        console.log('  ❌ Selected office not found or inactive');
        return {
          success: false,
          userId: null,
          error: new Error('Selected office is not available. Please contact admin.'),
        };
      }

      console.log('  🏢 Assigning to office:', selectedOffice.name);

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

      // Step 2: Handle profile photo and rename if needed
      let profilePhotoUrl: string | null = null;
      
      // Option 1: Photo URL provided (client-side registration)
      if (profile_photo_url) {
        // Check if this is a temporary file that needs renaming
        if (profile_photo_url.includes('temp-')) {
          try {
            // Extract the temporary file path from URL
            const urlParts = profile_photo_url.split('/');
            const tempFileName = urlParts[urlParts.length - 1];
            const fileExt = tempFileName.split('.').pop();
            const tempFilePath = `profile-photos/${tempFileName}`;
            const newFileName = `${userId}-${Date.now()}.${fileExt}`;
            const newFilePath = `profile-photos/${newFileName}`;

            // Move/copy the file to the new location with proper user ID
            const { data: fileData } = await supabase.storage
              .from('profile-photos')
              .download(tempFilePath);

            if (fileData) {
              const { error: uploadError } = await supabase.storage
                .from('profile-photos')
                .upload(newFilePath, fileData, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (!uploadError) {
                // Delete the temporary file
                await supabase.storage
                  .from('profile-photos')
                  .remove([tempFilePath]);

                // Get new public URL
                const { data: { publicUrl } } = supabase.storage
                  .from('profile-photos')
                  .getPublicUrl(newFilePath);
                
                profilePhotoUrl = publicUrl;
                console.log('  📸 Photo renamed and moved successfully');
              } else {
                // If rename fails, use the original URL
                profilePhotoUrl = profile_photo_url;
                console.log('  ⚠️  Photo rename failed, using original URL');
              }
            } else {
              profilePhotoUrl = profile_photo_url;
            }
          } catch (renameError) {
            console.error('  ⚠️  Photo rename error:', renameError);
            profilePhotoUrl = profile_photo_url;
          }
        } else {
          profilePhotoUrl = profile_photo_url;
          console.log('  📸 Using provided photo URL');
        }
      }
      // Option 2: Photo File provided (admin/server-side registration)  
      else if (profile_photo) {
        try {
          const fileExt = profile_photo.name.split('.').pop();
          const fileName = `${userId}-${Date.now()}.${fileExt}`;
          const filePath = `profile-photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, profile_photo, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('  ⚠️  Photo upload failed:', uploadError);
            // Continue registration even if photo upload fails
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(filePath);
            
            profilePhotoUrl = publicUrl;
            console.log('  📸 Profile photo uploaded');
          }
        } catch (photoError) {
          console.error('  ⚠️  Photo upload error:', photoError);
          // Continue registration even if photo upload fails
        }
      }

      // Step 3: Create profile record with status = 'pending'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name,
          role: 'employee',
          status: 'pending', // ⚠️ User is pending approval
          office_location: office_id, // Auto-assigned to SmartMatrix
          designation: designation || 'Not Assigned',
          role_type: role_type || 'Employee',
          profile_photo_url: profilePhotoUrl,
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

      // Step 4: Create employee_request record
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

      // Step 5: Immediately sign out the user (they cannot login until approved)
      await supabase.auth.signOut();

      console.log('  ✅ Registration successful, assigned to:', selectedOffice.name);

      return {
        success: true,
        userId,
        error: null,
        message: 'Registration successful. Awaiting admin approval.',
      };
    } catch (err) {
      console.log('  ❌ Registration failed:', err);
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
