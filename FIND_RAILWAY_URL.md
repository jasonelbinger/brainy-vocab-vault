# Railway Environment Variables Setup

## Critical Issue
Your Railway app is crashing with 502 errors because it's missing required environment variables.

## Railway Dashboard Steps
1. Go to **https://railway.app/dashboard**
2. Find your project: **brainy-vocab-vault-production**
3. Click on the project
4. Go to **Variables** tab
5. Add these two environment variables:

```
REPL_ID=brainy-vocab-vault-production
REPLIT_DOMAINS=brainy-vocab-vault-production.up.railway.app
```

## Why These Are Required
The authentication system requires these variables to function. Without them, the app crashes immediately on startup, causing the 502 error.

## After Adding Variables
1. Railway will automatically redeploy (2-3 minutes)
2. The 502 error will be resolved
3. Your vocabulary platform will be live
4. I can then add the gamified mastery badges

## Current Status
- Local development: Working (when not crashed)
- Railway: 502 error due to missing environment variables
- Database: Working properly
- All other variables: Set correctly

The only thing preventing your app from working is adding these two environment variables to Railway.