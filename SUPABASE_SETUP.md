# Supabase Setup Instructions

Your Supabase credentials are now configured! Follow these steps to complete the setup:

## 1. Run the Database Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `spjitxmpeglbaljdwcou`
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL from `supabase/migrations/20251217094222_create_initial_schema.sql`
6. Click **Run**

This will create all the necessary tables:
- `user_profiles` - User account information
- `teams` - Competition teams
- `team_members` - Team membership
- `competitions` - Competitions

## 2. Enable Authentication

1. Go to **Authentication** in the left sidebar
2. Click **Providers**
3. Enable **Email** provider (should be enabled by default)
4. In **Email/Password**, toggle it ON

## 3. Test Registration

Once the tables are created, go to your app and try registering:
- Frontend: http://localhost:5000
- Click "Get Started" or navigate to /register
- Fill in the form and click "Create Account"

The registration should now work with Supabase!

## Environment Variables (Already Set)

These are already configured in your Replit project:
- `SUPABASE_URL`: https://spjitxmpeglbaljdwcou.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: [Your API key]
- `REACT_APP_SUPABASE_URL`: [For frontend]
- `REACT_APP_SUPABASE_ANON_KEY`: [For frontend]

## Troubleshooting

If you get errors:
- **"Table not found"**: Make sure you ran the SQL migration
- **"Auth disabled"**: Enable Email provider in Authentication settings
- **"Permission denied"**: Check that your API key is correct

Let me know if you need help!
