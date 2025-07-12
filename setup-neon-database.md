# Neon Database Setup for Brainy Vocab Vault

## Step 1: Get Connection String
1. Click **"Connect"** in your Neon dashboard
2. Copy the connection string (starts with `postgresql://`)
3. It will look like: `postgresql://username:password@host/database?sslmode=require`

## Step 2: Update Environment Variables
Add this to your deployment platform (Vercel, Netlify, etc.):
```
DATABASE_URL=postgresql://your_connection_string_here
```

## Step 3: Initialize Database Schema
Run these commands to set up your database:

```bash
# Push schema to database
npm run db:push

# Initialize templates
node init-templates.js

# Create sample data (optional)
node create-sample-data.js
```

## Step 4: Test Database Connection
```bash
# Test the connection
node test-system.js
```

## Expected Database Tables
Your database will have these tables:
- `sessions` - User session storage
- `users` - User authentication data
- `card_templates` - Frayer model templates (9 total)
- `vocabulary_cards` - Student vocabulary cards
- `review_sessions` - Spaced repetition tracking
- `recent_activities` - Progress tracking

## Database Schema Summary
```sql
-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Card templates table
CREATE TABLE card_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  educational_explanation TEXT,
  field_configurations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary cards table
CREATE TABLE vocabulary_cards (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  template_id INTEGER REFERENCES card_templates(id),
  word VARCHAR NOT NULL,
  custom_fields JSONB,
  mastery_level INTEGER DEFAULT 0,
  next_review_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Review sessions table
CREATE TABLE review_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  card_id INTEGER REFERENCES vocabulary_cards(id),
  was_correct BOOLEAN,
  previous_mastery_level INTEGER,
  new_mastery_level INTEGER,
  review_date TIMESTAMP DEFAULT NOW()
);

-- Recent activities table
CREATE TABLE recent_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  activity_type VARCHAR,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Next Steps After Database Setup
1. Deploy to Vercel/Netlify with DATABASE_URL
2. Run initialization scripts
3. Test authentication and card creation
4. Verify all features work with live database

Your Neon database is ready - just get the connection string and deploy!