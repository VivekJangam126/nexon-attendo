# Fix Cloudinary 401 Error - Upload Preset Configuration

## Problem
Files uploaded to Cloudinary are returning HTTP 401 error because they're being uploaded as "Private" instead of "Public".

## Solution: Configure Upload Preset Correctly

### Step 1: Go to Upload Preset Settings
1. Login to Cloudinary: https://console.cloudinary.com
2. Go to Settings → Upload → Upload presets
3. Find your preset: `leave_attachments`
4. Click "Edit"

### Step 2: Configure These Settings

#### General Tab:
- **Upload preset name**: `leave_attachments`
- **Signing mode**: `Unsigned`
- **Asset folder**: `nexon-attendo/leave-requests`

#### Optimize and Deliver Tab:
- **Delivery type**: `Upload` (NOT Private or Authenticated)
- **Access control**: `Public` (NOT Private)
- **Format**: Leave empty (auto-detect)

#### Advanced Tab:
- **Overwrite assets with the same public ID**: `OFF` (unchecked)

### Step 3: Save the Preset
Click the blue "Save" button

### Step 4: Fix Existing Files (Optional)
For files already uploaded that show 401 error:

1. Go to Media Library
2. Find the file (search by name or browse)
3. Click on the file
4. Look for "Access Control" or "Type" 
5. Change from "Private" to "Public" or "Upload"
6. Save

### Step 5: Test with New Upload
1. Deploy your updated code
2. Apply for a new leave request
3. Upload a PDF or image
4. Submit
5. Check if the URL works without 401 error

## Alternative: Use Signed Uploads (More Secure)

If you want better security, you can use signed uploads instead:

1. Change preset to "Signed" mode
2. Create an API endpoint in your backend to generate signatures
3. Update the frontend to call your API for signature before upload

But for leave attachments, unsigned public uploads should be fine.

## Verification

After fixing, your Cloudinary URLs should work like this:
- ✓ `https://res.cloudinary.com/dmtq51eg0/image/upload/v123/file.pdf` - Works
- ✗ `https://res.cloudinary.com/dmtq51eg0/image/upload/v123/file.pdf` - 401 Error

The URL format is the same, but the access control determines if it's accessible.
