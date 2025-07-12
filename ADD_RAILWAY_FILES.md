# How to Add Railway Configuration Files to GitHub

## Step 1: Create railway.json
1. Go to your GitHub repository
2. Click "Add file" → "Create new file"
3. Name: `railway.json`
4. Content:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Create nixpacks.toml
1. Click "Add file" → "Create new file" again
2. Name: `nixpacks.toml`
3. Content:
```toml
[phases.build]
cmds = [
  "npm ci",
  "npm run build"
]

[phases.start]
cmd = "npm start"
```

## Step 3: Commit Both Files
1. Add commit message: "Add Railway deployment configuration"
2. Click "Commit new files"

## What Happens Next
- Railway automatically detects the new files
- Rebuilds your app with proper build configuration
- Your vocabulary learning platform becomes available
- Students can access the app at the Railway URL

## Why These Files Are Needed
- **railway.json**: Tells Railway how to deploy your app
- **nixpacks.toml**: Ensures frontend is built before server starts
- **Together**: Fix the 404 error and serve your app correctly

After adding these files, Railway will redeploy and your Brainy Vocab Vault will be live!