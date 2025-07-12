# Deploy to Render.com (Recommended)

Render.com is simpler than both Railway and Vercel for Node.js apps.

## Steps:
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: brainy-vocab-vault
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `DATABASE_URL` (your PostgreSQL URL)
   - `SESSION_SECRET` (any random string)
   - `MERRIAM_WEBSTER_API_KEY` (your API key)
   - `NODE_ENV` = `production`
   - `REPL_ID` = `brainy-vocab-vault`
   - `REPLIT_DOMAINS` = `brainy-vocab-vault.onrender.com`
7. Deploy

## Why Render is Better:
- Designed for Node.js apps
- Handles authentication better
- Simple deployment process
- Good free tier
- Better error messages

## Cleanup First:
- Delete duplicate Vercel projects
- Keep Railway as backup
- Focus on Render for main deployment