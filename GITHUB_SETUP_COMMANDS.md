# GitHub Setup Commands

## Run these commands in the Shell tab:

```bash
# Remove git lock file
rm -f .git/index.lock

# Add GitHub remote (your repository)
git remote add origin https://github.com/jasonelbinger/brainy-vocab-vault.git

# Add the fixed files
git add server/index.ts server/production-static.ts

# Commit the deployment fix
git commit -m "Fix deployment: separate production static serving from vite dependencies"

# Push to GitHub
git push -u origin main
```

## After pushing to GitHub:
1. Go to render.com
2. Find your "brainy-vocab-vault" service  
3. Click "Manual Deploy" button
4. Wait 3-5 minutes for rebuild

## The fix is ready - Render just needs the new code!