# Deployment Guide

## Platform Options

### 1. Vercel (Recommended)
Best for full-stack applications with PostgreSQL.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
vercel env add DATABASE_URL
vercel env add MERRIAM_WEBSTER_API_KEY
vercel env add SESSION_SECRET
```

### 2. Netlify
For frontend deployment with separate backend.

```bash
# Build frontend
npm run build

# Deploy to Netlify
# Upload dist/ folder or connect GitHub repo
```

### 3. Railway
Full-stack deployment with PostgreSQL.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up

# Add environment variables in Railway dashboard
```

### 4. Heroku
Traditional full-stack deployment.

```bash
# Install Heroku CLI
# Create Heroku app
heroku create brainy-vocab-vault

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

### 5. DigitalOcean App Platform
Modern cloud deployment.

```bash
# Connect GitHub repository
# Configure build settings:
# - Build command: npm run build
# - Run command: npm start
# - Environment variables via dashboard
```

## Database Setup

### Neon Database (Recommended)
```bash
# Create account at neon.tech
# Create new project
# Copy connection string to DATABASE_URL
```

### Supabase
```bash
# Create account at supabase.com
# Create new project
# Copy PostgreSQL connection string
```

### Local PostgreSQL
```bash
# Install PostgreSQL
# Create database
createdb brainy_vocab_vault

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/brainy_vocab_vault
```

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Templates initialized (`node init-templates.js`)
- [ ] Authentication OAuth configured
- [ ] API keys valid and working
- [ ] Build process successful (`npm run build`)
- [ ] Database schema updated (`npm run db:push`)

## Post-Deployment

### 1. Initialize Templates
```bash
# Run on production database
node init-templates.js
```

### 2. Test Core Features
- [ ] User authentication
- [ ] Template loading
- [ ] Card creation
- [ ] Review sessions
- [ ] Teacher dashboard

### 3. Monitor Performance
- Database connection pool
- API response times
- Memory usage
- Error rates

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL format
- Check database server status
- Ensure proper SSL settings

**Authentication Issues**
- Verify OAuth credentials
- Check domain configuration
- Ensure SESSION_SECRET is set

**Template Loading Problems**
- Run `node init-templates.js`
- Check database permissions
- Verify template table exists

**Build Failures**
- Check TypeScript errors
- Verify all dependencies installed
- Ensure proper node version (18+)

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `MERRIAM_WEBSTER_API_KEY` | Dictionary API key | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `REPL_ID` | Replit application ID | If using Replit |
| `REPLIT_DOMAINS` | Allowed domains | If using Replit |
| `ISSUER_URL` | OAuth issuer URL | If using Replit |

## Security Considerations

- Use strong SESSION_SECRET (32+ characters)
- Enable HTTPS in production
- Validate all user inputs
- Rate limit API endpoints
- Regular security updates
- Monitor database access logs

## Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement database connection pooling
- Cache frequently accessed data
- Monitor query performance
- Optimize image loading

## Backup Strategy

- Regular database backups
- Environment variable backup
- Code repository backup
- User data export functionality
- Recovery testing procedures