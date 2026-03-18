/**
 * Face Recognition Service
 * Handles communication with Python ML service for face recognition
 */

import { supabase } from '../supabase/client';

interface FaceRegistrationResult {
  success: boolean;
  message: string;
  encoding_saved?: boolean;
  faces_detected?: number;
  processing_time_ms?: number;
}

interface FaceVerificationResult {
  success: boolean;
  verified: boolean;
  confidence: number;
  message: string;
  faces_detected: number;
  processing_time_ms?: number;
}

interface FaceRegistrationStatus {
  registered: boolean;
  message: string;
}

export const faceRecognitionService = {
  /**
   * Check if ML service is available
   */
  async isMLServiceAvailable(): Promise<boolean> {
    try {
      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
      const response = await fetch(`${ML_SERVICE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      return response.ok;
    } catch (error) {
      console.log('ML service not available:', error);
      return false;
    }
  },

  /**
   * Register employee face with ML service using multiple photos (burst mode)
   * 
   * @param employeeId - UUID of employee
   * @param imageBase64Array - Array of base64 encoded images
   * @returns Registration result
   */
  async registerFaceWithPhotos(employeeId: string, imageBase64Array: string[]): Promise<FaceRegistrationResult> {
    try {
      const isAvailable = await this.isMLServiceAvailable();
      
      if (!isAvailable) {
        return {
          success: false,
          message: 'ML service is not available. Face registration will be enabled once the service is configured.',
        };
      }

      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
      
      console.log(`🚀 Registering face with ${imageBase64Array.length} photos for employee: ${employeeId}`);
      
      const response = await fetch(`${ML_SERVICE_URL}/register-face`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          face_photos: imageBase64Array,
        }),
        signal: AbortSignal.timeout(180000), // 3 minute timeout for multiple photos
      });

      const result = await response.json();

      if (result.success && result.encoding_saved) {
        // Update profile to mark face as registered
        await supabase
          .from('profiles')
          .update({
            face_registered: true,
            face_registered_at: new Date().toISOString(),
          })
          .eq('id', employeeId);
        
        console.log(`✅ Face registration successful: ${result.faces_detected} photos processed`);
      }

      return result;
    } catch (error) {
      console.error('Face registration error:', error);
      return {
        success: false,
        message: `Face registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  /**
   * Register employee face with ML service (legacy single photo method)
   * 
   * @param employeeId - UUID of employee
   * @param imageBase64 - Base64 encoded image
   * @returns Registration result
   */
  async registerFace(employeeId: string, imageBase64: string): Promise<FaceRegistrationResult> {
    // Use the new multi-photo method with single photo
    return this.registerFaceWithPhotos(employeeId, [imageBase64]);
  },

  /**
   * Verify employee face during attendance
   * 
   * @param employeeId - UUID of employee
   * @param selfieBase64 - Base64 encoded selfie
   * @param attendanceId - Optional attendance ID for logging
   * @returns Verification result
   */
  async verifyFace(
    employeeId: string, 
    selfieBase64: string, 
    attendanceId?: string
  ): Promise<FaceVerificationResult> {
    try {
      const isAvailable = await this.isMLServiceAvailable();
      
      if (!isAvailable) {
        return {
          success: false,
          verified: false,
          confidence: 0,
          message: 'ML service is not available. Face verification is temporarily disabled.',
          faces_detected: 0,
        };
      }

      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${ML_SERVICE_URL}/verify-face`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          selfie: selfieBase64,
          attendance_id: attendanceId,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Face verification error:', error);
      return {
        success: false,
        verified: false,
        confidence: 0,
        message: `Face verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        faces_detected: 0,
      };
    }
  },

  /**
   * Check if employee has registered face
   * 
   * @param employeeId - UUID of employee
   * @returns Registration status
   */
  async checkFaceRegistration(employeeId: string): Promise<FaceRegistrationStatus> {
    try {
      // Always check database first for face_registered flag
      const { data: profile } = await supabase
        .from('profiles')
        .select('face_registered')
        .eq('id', employeeId)
        .single();

      const isRegisteredInDB = profile?.face_registered || false;

      // If not registered in database, return false
      if (!isRegisteredInDB) {
        return {
          registered: false,
          message: 'Face not registered',
        };
      }

      // If registered in database, check if ML service is available
      const isAvailable = await this.isMLServiceAvailable();
      
      return {
        registered: true,
        message: isAvailable 
          ? 'Face registered and ML service available'
          : 'Face registered (ML service offline)',
      };
    } catch (error) {
      console.error('Face registration check error:', error);
      return {
        registered: false,
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Upload profile photo to Supabase Storage and register face
   * 
   * @param employeeId - UUID of employee
   * @param photoFile - Photo file
   * @returns Upload and registration result
   */
  async uploadAndRegisterPhoto(
    employeeId: string, 
    photoFile: File
  ): Promise<{
    success: boolean;
    message: string;
    photoUrl?: string;
    faceRegistered?: boolean;
  }> {
    try {
      // Upload photo to Supabase Storage
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${employeeId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting existing photos
        });

      if (uploadError) {
        return {
          success: false,
          message: `Photo upload failed: ${uploadError.message}`,
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update profile with photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_photo_url: publicUrl,
        })
        .eq('id', employeeId);

      if (updateError) {
        return {
          success: false,
          message: `Profile update failed: ${updateError.message}`,
        };
      }

      // Convert file to base64 for ML service
      const base64 = await this.fileToBase64(photoFile);
      
      // Register face with ML service
      const faceResult = await this.registerFace(employeeId, base64);

      return {
        success: true,
        message: faceResult.success 
          ? 'Photo uploaded and face registered successfully'
          : 'Photo uploaded successfully. Face registration will be enabled once ML service is configured.',
        photoUrl: publicUrl,
        faceRegistered: faceResult.success,
      };
    } catch (error) {
      console.error('Photo upload and registration error:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Convert File to base64 string
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Get ML service status and statistics
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    version?: string;
    registeredFaces?: number;
    recentVerifications?: number;
  }> {
    try {
      const isAvailable = await this.isMLServiceAvailable();
      
      if (!isAvailable) {
        return { available: false };
      }

      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${ML_SERVICE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      const result = await response.json();

      // Get statistics from database
      const { count: registeredFaces } = await supabase
        .from('face_encodings')
        .select('*', { count: 'exact', head: true });

      const { count: recentVerifications } = await supabase
        .from('face_verification_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        available: true,
        version: result.version || '1.0.0',
        registeredFaces: registeredFaces || 0,
        recentVerifications: recentVerifications || 0,
      };
    } catch (error) {
      console.error('Service status error:', error);
      return { available: false };
    }
  },
};