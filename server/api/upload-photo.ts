import { supabase } from '../supabase/client';
import { faceRecognitionService } from '../services/face-recognition.service';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId, photoData, fileName } = req.body;

    if (!employeeId || !photoData || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer
    const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${employeeId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-photos/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update profile with photo URL and set face_registered flag
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        profile_photo_url: publicUrl,
        face_registered: true,
        face_registered_at: new Date().toISOString()
      })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Try to register face with ML service (but don't fail if it doesn't work)
    let faceRegistrationMessage = '';
    try {
      const faceResult = await faceRecognitionService.registerFace(employeeId, photoData);
      if (faceResult.success) {
        faceRegistrationMessage = ' Face recognition has been enabled.';
      } else {
        faceRegistrationMessage = ' Face recognition will be enabled once ML service is configured.';
      }
    } catch (error) {
      console.log('Face registration failed (ML service may be offline):', error);
      faceRegistrationMessage = ' Face recognition will be enabled once ML service is configured.';
    }

    return res.json({ 
      success: true, 
      photoUrl: publicUrl,
      message: `Photo uploaded successfully.${faceRegistrationMessage}` 
    });

  } catch (error: any) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}