# Supabase Setup Guide for HyperFit

## 1. Create Supabase Project

1. Go to https://supabase.com/
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: HyperFit (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be provisioned (2-3 minutes)

## 2. Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
3. Update `supabase.config.ts` with these values

## 3. Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase-migration.sql`
4. Click "Run" to execute the migration
5. Verify the table was created:
   - Go to **Table Editor**
   - You should see `user_data` table

## 4. Enable Google OAuth

### 4.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - For development: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - For production: `hyperfit://auth/callback`
7. Copy the **Client ID** and **Client Secret**

### 4.2 Configure in Supabase

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to enable
3. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
4. Click **Save**

### 4.3 Add Redirect URLs in Supabase

1. Go to **Authentication** > **URL Configuration**
2. Add to **Redirect URLs**:
   - `hyperfit://auth/callback`
   - `exp://localhost:8081/--/auth/callback` (for Expo Go)
   - `http://localhost:8081/--/auth/callback` (for web)

## 5. Configure Email Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. **Email** provider should be enabled by default
3. Configure email settings:
   - **Enable email confirmations**: Optional (recommended for production)
   - **Enable email change confirmations**: Optional
4. Configure email templates if needed

## 6. Test Authentication

### Email/Password

1. Run the app: `npm start`
2. Try signing up with email/password
3. Check Supabase **Authentication** > **Users** to see the new user

### Google OAuth

1. Make sure Google OAuth is configured (step 4)
2. Run the app: `npm start`
3. Click "Continue with Google"
4. Complete OAuth flow
5. Verify user appears in Supabase

## 7. Verify Database Integration

1. Sign in to the app
2. Create a workout or update data
3. In Supabase dashboard, go to **Table Editor** > **user_data**
4. Verify your data is being saved

## Troubleshooting

### OAuth Not Working

- **Issue**: Redirect URL mismatch
  - **Solution**: Ensure redirect URLs in Google Console match Supabase configuration
  - Check that `hyperfit://auth/callback` is added to both places

- **Issue**: "Invalid client" error
  - **Solution**: Verify Client ID and Secret are correct in Supabase

### Database Errors

- **Issue**: "relation user_data does not exist"
  - **Solution**: Run the migration SQL in Supabase SQL Editor

- **Issue**: "permission denied"
  - **Solution**: Check Row Level Security policies are created correctly

### Email Not Sending

- **Issue**: Emails not received
  - **Solution**: 
    - Check Supabase **Authentication** > **Email Templates**
    - For production, configure custom SMTP in **Settings** > **Auth**

## Production Checklist

- [ ] Custom SMTP configured for emails
- [ ] Email confirmations enabled (recommended)
- [ ] Redirect URLs updated for production domain
- [ ] Row Level Security policies tested
- [ ] Database backups configured
- [ ] Monitoring and alerts set up

## Security Best Practices

1. **Never commit** `supabase.config.ts` with real credentials to git
2. Use environment variables for production
3. Enable email confirmations in production
4. Regularly review RLS policies
5. Monitor authentication logs in Supabase dashboard

## Next Steps

After setup:
1. ✅ Test email/password authentication
2. ✅ Test Google OAuth
3. ✅ Verify data persistence
4. ✅ Test on physical devices
5. ✅ Configure production settings

For more help, check:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Expo Auth Session](https://docs.expo.dev/guides/authentication/)

