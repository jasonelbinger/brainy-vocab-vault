# Railway Deployment Fix Instructions

## Problem Identified
The Railway deployment was failing because the port was hardcoded to 5000, but Railway uses dynamic ports.

## Fix Applied
✅ Changed server port configuration to use Railway's PORT environment variable
✅ Updated railway.json configuration

## What You Need to Do

### Step 1: Update GitHub Repository
1. Go to your GitHub repository: `https://github.com/yourname/brainy-vocab-vault`
2. Click "Add file" → "Upload files"
3. Upload these two files from your computer:
   - `server/index.ts` (with the port fix)
   - `railway.json` (with the updated configuration)

### Step 2: Railway Will Auto-Redeploy
Once you update GitHub:
- Railway will automatically detect the changes
- It will rebuild and redeploy your app
- The new deployment should work correctly

### Step 3: Test Your App
After redeployment (takes 2-3 minutes):
1. Go back to your Railway URL: `https://brainy-vocab-vault-production.up.railway.app`
2. You should see your Brainy Vocab Vault landing page
3. Test the Google sign-in functionality

## Alternative: Manual Repository Update
If you can't upload files, you can:
1. Edit `server/index.ts` directly in GitHub
2. Change line 65-66 from:
   ```
   const port = 5000;
   ```
   to:
   ```
   const port = process.env.PORT || 5000;
   ```
3. Commit the change

## Expected Result
After the fix, your Railway app should display:
- Landing page with "Brainy Vocab Vault" title
- "Sign in with Google" button
- Full vocabulary learning functionality

Your app is ready - just needs this port configuration update!