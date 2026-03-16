-- Create Supabase Storage bucket for profile photos
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile-photos bucket

-- Allow public read access (so photos can be displayed)
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow anyone to upload profile photos (needed for registration)
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Allow authenticated users to update their own photos
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
);

-- Allow users to delete their own photos
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
);

-- Allow service role full access (for admin operations)
DROP POLICY IF EXISTS "Service role has full access to profile photos" ON storage.objects;
CREATE POLICY "Service role has full access to profile photos"
ON storage.objects FOR ALL
USING (bucket_id = 'profile-photos' AND auth.role() = 'service_role');
