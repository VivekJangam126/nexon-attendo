# Fix Cloudinary 401 Error - Files Not Accessible

## Problem
When clicking "View Document", you get HTTP ERROR 401 - This means the uploaded files are not publicly accessible.

## Solution: Update Upload Preset Settings

### Step 1: Go to Cloudinary Upload Preset Settings
1. Login to https://cloudinary.com/console
2. Click **Settings** (gear icon in top right)
3. Click **Upload** tab
4. Scroll down to **Upload presets** section
5. Find your `leave_attachments` preset
6. Click **Edit** (pencil icon)

### Step 2: Configure Public Access
Make sure these settings are configured:

**Basic Settings:**
- **Preset name**: `leave_attachments`
- **Signing Mode**: **Unsigned** ⚠️ IMPORTANT
- **Folder**: `nexon-attendo/leave-requests`

**Access Control:**
- **Access mode**: **Public** (not Authenticated)
- **Delivery type**: **Upload**
- **Resource type**: **Auto**

**Security:**
- **Unique filename**: Enable (optional, but recommended)
- **Overwrite**: Disable (recommended)

### Step 3: Save Changes
1. Scroll to bottom
2. Click **Save**

### Step 4: Test Again
1. Go back to your app
2. Submit a new leave request with an attachment
3. The new upload should be publicly accessible

## Alternative: Delete and Recreate Preset

If editing doesn't work, delete the preset and create a new one:

1. **Delete old preset:**
   - Go to Settings → Upload → Upload presets
   - Find `leave_attachments`
   - Click Delete (trash icon)
   - Confirm deletion

2. **Create new preset:**
   - Click **Add upload preset**
   - **Preset name**: `leave_attachments`
   - **Signing Mode**: **Unsigned**
   - **Folder**: `nexon-attendo/leave-requests`
   - **Access mode**: **Public**
   - Click **Save**

## Verify Upload Preset is Correct

After saving, verify these settings:
- ✅ Signing Mode = Unsigned
- ✅ Access mode = Public
- ✅ Folder = nexon-attendo/leave-requests

## Fix Existing Uploaded Files

If you already uploaded files that show 401 error:

1. Go to Cloudinary Media Library
2. Find the files in `nexon-attendo/leave-requests` folder
3. Select the files
4. Click **Manage** → **Update access mode**
5. Select **Public**
6. Click **Update**

## Common Mistakes

❌ **Signing Mode = Signed** → Change to Unsigned
❌ **Access mode = Authenticated** → Change to Public
❌ **Wrong preset name** → Must be exactly `leave_attachments`
❌ **Forgot to save** → Always click Save button

## Still Not Working?

If files still show 401 error after fixing the preset:
1. Delete the old test leave request
2. Submit a NEW leave request with attachment
3. The new upload will use the corrected settings
4. Old uploads may still show 401 (you can manually fix them in Media Library)
