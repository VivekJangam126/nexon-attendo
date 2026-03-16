-- Complete Photo Upload Fix
-- Run this in Supabase SQL Editor to ensure photo upload works

-- 1. Ensure profile_photo_url column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'profile_photo_url') THEN
        ALTER TABLE profiles ADD COLUMN profile_photo_url TEXT;
        RAISE NOTICE 'Added profile_photo_url column to profiles table';
    ELSE
        RAISE NOTICE 'profile_photo_url column already exists';
    END IF;
END $$;

-- 2. Create the profile-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for profile-photos bucket

-- Allow public read access (so photos can be displayed)
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow anyone to upload profile photos (needed for registration and updates)
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Allow authenticated users to update profile photos
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
CREATE POLICY "Users can update profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos');

-- Allow users to delete profile photos
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;
CREATE POLICY "Users can delete profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos');

-- Allow service role full access (for admin operations)
DROP POLICY IF EXISTS "Service role has full access to profile photos" ON storage.objects;
CREATE POLICY "Service role has full access to profile photos"
ON storage.objects FOR ALL
USING (bucket_id = 'profile-photos' AND auth.role() = 'service_role');

-- 4. Verify the setup
SELECT 'Bucket created' as status, id, name, public 
FROM storage.buckets 
WHERE id = 'profile-photos';

SELECT 'Column exists' as status, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profile_photo_url';

-- 5. Test data - check current profiles
SELECT 'Current profiles' as status, id, email, full_name, 
       CASE 
         WHEN profile_photo_url IS NOT NULL THEN 'Has photo URL'
         ELSE 'No photo URL'
       END as photo_status
FROM profiles 
WHERE role = 'employee'
ORDER BY created_at DESC
LIMIT 5;