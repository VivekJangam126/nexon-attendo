# 🚀 Deploy notification-cron Function

## Problem
The Supabase CLI has installation/permission issues on Windows. Here are alternative methods to deploy the updated function.

---

## Method 1: Deploy via Supabase Dashboard (Easiest)

### Step 1: Copy the Function Code
The updated function is located at: `supabase/functions/notification-cron/index.ts`

### Step 2: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/falbkccaqjqdbvrmdlll/functions
2. Click on "Edge Functions" in the left sidebar
3. Find `notification-cron` in the list (or create new if it doesn't exist)

### Step 3: Update the Function
1. Click on the `notification-cron` function
2. Click "Edit function" or "Deploy new version"
3. Copy the entire contents of `supabase/functions/notification-cron/index.ts`
4. Paste it into the editor
5. Click "Deploy" or "Save"

---

## Method 2: Install Supabase CLI via Scoop (Windows)

### Step 1: Install Scoop (if not already installed)
Open PowerShell and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Step 2: Install Supabase CLI
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 3: Deploy the Function
```powershell
supabase functions deploy notification-cron
```

---

## Method 3: Manual Deployment via API

You can deploy the function using the Supabase Management API:

### Step 1: Get Your Access Token
1. Go to: https://supabase.com/dashboard/account/tokens
2. Create a new access token or use existing one

### Step 2: Create Deployment Script

Save this as `deploy-cron.ps1`:

```powershell
# Configuration
$PROJECT_REF = "falbkccaqjqdbvrmdlll"
$ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"
$FUNCTION_NAME = "notification-cron"

# Read the function code
$functionCode = Get-Content -Path "supabase/functions/notification-cron/index.ts" -Raw

# Create the deployment payload
$payload = @{
    slug = $FUNCTION_NAME
    name = $FUNCTION_NAME
    body = $functionCode
    verify_jwt = $false
} | ConvertTo-Json

# Deploy the