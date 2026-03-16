# Photo Upload Implementation Guide

## Issue
Profile photos uploaded for existing employees are not showing on both employee and admin sides.

## Root Cause
The photo upload functionality was not fully implemented:
1. Missing API endpoint for photo upload
2. Frontend had placeholder code instead of actual upload logic
3. Storage bucket and policies might not be properly configured

## Solution Implemented

### 1. Created Photo Upload API Endpoint
- **File**: `server/api/upload-photo.ts`
- **Functionality**: 
  - Accepts base64 image data
  - Uploads to Supabase Storage `profile-photos` bucket
  - Updates `profiles.profile_photo_url` field
  - Returns success status and photo URL

### 2. Updated Frontend Components

#### Admin Side (`AdminEmployeeDetailScreen.tsx`)
- Implemented actual photo upload in `handleUploadPhoto` function
- Converts selected file to base64
- Calls `/api/upload-photo` endpoint
- Refreshes employee data after successful upload

#### Employee Side (`ProfileScreen.tsx`)
- Added photo upload dialog and functionality
- Added upload button in profile photo section
- Uses `refreshProfile()` from useAuth hook to update data

### 3. Updated Vite Configuration
- Added `upload-photo` route to API middleware in `vite.config.ts`

### 4. Database Setup Scripts

#### `COMPLETE_PHOTO_UPLOAD_FIX.sql`
- Ensures `profile_photo_url` column exists in profiles table
- Creates `profile-photos` storage bucket
- Sets up proper RLS policies for public read and authenticated upload/update

## Setup Instructions

### 1. Run Database Setup
Execute `COMPLETE_PHOTO_UPLOAD_FIX.sql` in Supabase SQL Editor:
```sql
-- This will:
-- 1. Add profile_photo_url column if missing
-- 2. Create profile-photos bucket
-- 3. Set up RLS policies
```

### 2. Verify Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Confirm `profile-photos` bucket exists and is public
3. Check that policies allow uploads and public reads

### 3. Test Upload Functionality
1. Login as admin
2. Go to employee detail page
3. Click "Upload Photo" button
4. Select and upload an image
5. Verify photo appears immediately

### 4. Test Employee Side
1. Login as employee
2. Go to Profile page
3. Click "Upload" button in photo section
4. Upload image and verify it appears

## Verification Steps

### Check Database
```sql
-- Verify column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profile_photo_url';

-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'profile-photos';

-- Check uploaded files
SELECT * FROM storage.objects WHERE bucket_id = 'profile-photos';
```

### Test API Endpoint
```bash
# Test the upload endpoint (replace with actual data)
curl -X POST http://localhost:8081/api/upload-photo \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "user-id-here",
    "photoData": "data:image/jpeg;base64,/9j/4AAQ...",
    "fileName": "test.jpg"
  }'
```

## File Changes Made

1. **New Files**:
   - `server/api/upload-photo.ts` - Photo upload API endpoint
   - `COMPLETE_PHOTO_UPLOAD_FIX.sql` - Database setup script
   - `PHOTO_UPLOAD_IMPLEMENTATION_GUIDE.md` - This guide

2. **Modified Files**:
   - `src/pages/admin/AdminEmployeeDetailScreen.tsx` - Implemented actual upload
   - `src/pages/ProfileScreen.tsx` - Added upload functionality for employees
   - `vite.config.ts` - Added upload-photo route to API middleware

## Expected Behavior After Fix

1. **Admin uploads photo for employee**:
   - Photo appears immediately in admin employee detail view
   - Photo also visible when employee logs in to their profile

2. **Employee uploads their own photo**:
   - Photo appears immediately in employee profile
   - Photo also visible to admin in employee management

3. **Photo persistence**:
   - Photos stored in Supabase Storage with public URLs
   - URLs saved in `profiles.profile_photo_url` field
   - Photos load automatically when profile data is fetched

## Troubleshooting

### Photo not appearing after upload
1. Check browser console for API errors
2. Verify Supabase Storage bucket permissions
3. Check if `profile_photo_url` field is being updated in database

### Upload fails
1. Check file size (must be < 5MB)
2. Check file type (JPG, PNG only)
3. Verify API endpoint is accessible
4. Check Supabase Storage policies

### Database issues
1. Run `CHECK_PROFILE_PHOTO_DATA.sql` to verify table structure
2. Check if RLS policies are blocking updates
3. Verify service role key has proper permissions