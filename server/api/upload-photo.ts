import { supabase } from '../supabase/client';

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

    // Update profile with photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        profile_photo_url: publicUrl
      })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.json({ 
      success: true, 
      photoUrl: publicUrl,
      message: 'Photo uploaded successfully.' 
    });

  } catch (error: any) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}