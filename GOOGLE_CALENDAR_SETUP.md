# Google Calendar API Setup Guide

## Overview
This guide will help you set up the Google Calendar API to automatically fetch accurate holiday data for your calendar system.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select existing project
3. Enter project name: `Holiday Calendar API`
4. Click "Create"

## Step 2: Enable Calendar API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click **"Enable"**

## Step 3: Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"API Key"**
4. Copy the generated API key
5. Click **"Restrict Key"** (recommended)

## Step 4: Restrict API Key (Security)

1. Under **"API restrictions"**:
   - Select "Restrict key"
   - Choose "Google Calendar API"
2. Under **"Application restrictions"** (optional):
   - Select "HTTP referrers" 
   - Add your domain: `https://yourdomain.com/*`
3. Click **"Save"**

## Step 5: Add API Key to Environment

1. Open your `.env` file
2. Add the API key:
```env
GOOGLE_CALENDAR_API_KEY=your_actual_api_key_here
```

## Step 6: Test the Integration

1. Start your application
2. Go to Admin Holiday Calendar
3. Check the sync status in the header
4. Click "Sync" button to test manual sync

## Holiday Data Sources

The system fetches from Google's official holiday calendars:
- **Indian Holidays**: `en.indian#holiday@group.v.calendar.google.com`
- Includes: Republic Day, Independence Day, Diwali, Holi, etc.

## Automatic Sync Schedule

- **Daily Check**: System checks for missing holidays
- **October**: Automatically prepares next year's holidays
- **Year-end**: Seamless transition to new year

## Fallback System

If Google API is unavailable, the system uses accurate fallback data:
- Fixed holidays: New Year, Republic Day, Independence Day, etc.
- Dynamic holidays: Holi, Diwali, Eid (pre-calculated for 2026-2027)

## API Quotas (FREE)

- **Daily Requests**: 1,000,000 (more than enough)
- **Rate Limit**: 100 requests/second
- **Cost**: 100% FREE

## Troubleshooting

### No holidays appearing:
1. Check API key in `.env` file
2. Verify API is enabled in Google Cloud Console
3. Check browser console for errors
4. Try manual sync from admin panel

### API errors:
1. Check API key restrictions
2. Verify domain is whitelisted
3. Ensure Calendar API is enabled

### Sync status shows 0 holidays:
1. Click manual "Sync" button
2. Check server logs for errors
3. Fallback data will be used if API fails

## Benefits

✅ **Accurate Data**: Google's official holiday calendar
✅ **Automatic Updates**: No manual work required
✅ **Real-world Dates**: Matches actual calendar dates
✅ **Year-end Transition**: Seamless new year updates
✅ **Fallback Protection**: Works even if API is down

## Support

If you encounter issues:
1. Check the sync status in admin header
2. Try manual sync button
3. Check browser console for errors
4. Verify API key setup in Google Cloud Console