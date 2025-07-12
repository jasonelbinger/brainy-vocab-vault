# Render TSX Fix - Installing as Production Dependency

## Problem
TSX was in devDependencies but Render needs it in production dependencies.

## Solution
Installing tsx as a production dependency using the packager tool.

## Expected Result
- tsx will be available in production
- Render start command `npx tsx server/index.ts` will work
- Vocabulary app will deploy successfully

## After Installation
Update Render start command to:
```
npx tsx server/index.ts
```

## Environment Variables (should be set)
- DATABASE_URL
- SESSION_SECRET  
- MERRIAM_WEBSTER_API_KEY
- NODE_ENV=production
- REPL_ID=brainy-vocab-vault
- REPLIT_DOMAINS=brainy-vocab-vault.onrender.com

## Next Steps
1. Wait for tsx installation to complete
2. Push to GitHub (if needed)
3. Update Render start command
4. Test deployment
5. Add gamified mastery badges!