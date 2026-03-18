import { registrationService } from '../services/registration.service';

export default async function handler(req: any, res: any) {
  try {
    console.log('🔍 [REGISTER API] Request received:', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body
    });

    if (req.method !== 'POST') {
      console.log('❌ [REGISTER API] Method not allowed:', req.method);
      return res.status(405).json({ 
        success: false, 
        error: { message: 'Method not allowed. Use POST.' }
      });
    }

    const { email, password, full_name, office_id, role_type, designation, face_photos } = req.body;

    console.log('📝 [REGISTER API] Registration data received:', {
      email,
      full_name,
      office_id,
      role_type,
      designation,
      face_photos_count: face_photos?.length || 0
    });

    // Validate required fields
    if (!email || !password || !full_name || !office_id || !role_type || !designation) {
      console.log('❌ [REGISTER API] Missing required fields');
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' }
      });
    }

    // Validate face photos
    if (!face_photos || !Array.isArray(face_photos) || face_photos.length === 0) {
      console.log('❌ [REGISTER API] No face photos provided');
      return res.status(400).json({
        success: false,
        error: { message: 'Face photos are required for registration' }
      });
    }

    console.log('🚀 [REGISTER API] Starting registration process...');

    // Call registration service
    const result = await registrationService.registerEmployeeWithFace({
      email,
      password,
      full_name,
      office_id,
      role_type,
      designation,
      face_photos
    });

    console.log('📊 [REGISTER API] Registration result:', {
      success: result.success,
      userId: result.userId,
      hasError: !!result.error
    });

    if (result.success) {
      console.log('✅ [REGISTER API] Registration successful');
      return res.status(200).json({
        success: true,
        userId: result.userId,
        message: 'Registration successful. Awaiting admin approval.'
      });
    } else {
      console.log('❌ [REGISTER API] Registration failed:', result.error?.message);
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error: any) {
    console.error('❌ [REGISTER API] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Internal server error' }
    });
  }
}