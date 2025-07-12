# Render.com Fix - Updated Configuration

## The Problem
Render is looking for a compiled JavaScript file at `/opt/render/project/src/dist/index.js` but the project doesn't have a proper build step.

## Solution: Update Render Configuration

In your Render.com dashboard:

1. **Go to your service settings**
2. **Change the Start Command from:**
   ```
   npm start
   ```
   **To:**
   ```
   NODE_ENV=production tsx server/index.ts
   ```

3. **Make sure Build Command is:**
   ```
   npm install
   ```

## Why This Works
- `tsx` can run TypeScript files directly
- No need for a complex build process
- Simpler deployment

## Alternative: Use npm run dev
You could also use:
```
npm run dev
```
But the tsx command is more direct for production.

## Environment Variables Needed
Make sure these are set in Render:
- `DATABASE_URL`
- `SESSION_SECRET`
- `MERRIAM_WEBSTER_API_KEY`
- `NODE_ENV=production`
- `REPL_ID=brainy-vocab-vault`
- `REPLIT_DOMAINS=brainy-vocab-vault.onrender.com`

## After Making Changes
Render will automatically redeploy and should work correctly.