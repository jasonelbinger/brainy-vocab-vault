# Render Simple Start Command Fix

## The Problem
TSX is failing on Render due to TypeScript path resolution issues:
`ERR_MODULE_NOT_FOUND` - tsx can't resolve TypeScript paths

## Solution: Use Node.js Directly
Instead of tsx, use Node.js with built-in TypeScript support:

### Update Render Start Command to:
```
node --loader tsx/esm server/index.ts
```

### Alternative (if that fails):
```
node --experimental-loader tsx/esm server/index.ts
```

### Or the simplest approach:
```
tsx server/index.ts
```
But set working directory to the project root.

## Why This Works
- Uses Node.js built-in module loader
- Avoids complex TypeScript path resolution
- Simpler execution model

## After Updating Start Command
Render should successfully start the application and your vocabulary app will go live.

## Environment Variables Should Be Set
- DATABASE_URL ✅
- SESSION_SECRET ✅
- MERRIAM_WEBSTER_API_KEY ✅
- NODE_ENV=production ✅
- REPL_ID=brainy-vocab-vault ✅
- REPLIT_DOMAINS=brainy-vocab-vault.onrender.com ✅