# Cloudinary Setup Guide for Leave Attachments

## Quick Setup (5 minutes)

### Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/users/register_free
2. Sign up for a free account (no credit card required)
3. Verify your email

### Step 2: Get Your Cloud Name
1. After login, you'll see your Dashboard
2. Copy your **Cloud name** (it's at the top of the dashboard)
3. Example: `dxyz123abc`

### Step 3: Create Upload Preset
1. In Cloudinary Dashboard, click **Settings** (gear icon)
2. Click **Upload** tab
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `leave_attachments`
   - **Signing Mode**: Select **Unsigned**
   - **Folder**: `nexon-attendo/leave-requests`
   - Click **Save**

### Step 4: Update .env File
1. Open `nexon-attendo/.env`
2. Find this line:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   ```
3. Replace `your_cloud_name_here` with your actual cloud name:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=dxyz123abc
   ```
4. Save the file

### Step 5: Restart Dev Server
1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev` or `bun dev`

## Testing
1. Go to Leave page
2. Click "Apply Leave"
3. Fill the form
4. Upload an image or PDF
5. Submit
6. Check Cloudinary dashboard to see the uploaded file

## Troubleshooting

### Error: "Cloudinary is not configured"
- Make sure you updated the .env file with your actual cloud name
- Restart the dev server after changing .env

### Error: "Upload preset not found"
- Make sure you created the upload preset named exactly `leave_attachments`
- Make sure it's set to **Unsigned** mode

### Error: "Invalid signature"
- The upload preset must be **Unsigned**
- Check the preset name is exactly `leave_attachments`

## Free Tier Limits
- 25 GB storage
- 25 GB bandwidth/month
- More than enough for leave attachments!

## Security Notes
- Files are stored in Cloudinary, not your database
- Only the URL is stored in the database
- Cloudinary provides automatic image optimization
- Files are served via CDN for fast loading
