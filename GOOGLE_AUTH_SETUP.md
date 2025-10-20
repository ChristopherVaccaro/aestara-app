# Google Authentication Setup Guide

This guide will help you configure Google OAuth authentication for the AI Image Stylizer app using Supabase Auth.

## Prerequisites

- Supabase project (already set up: `ioasopowtifgaahldglq`)
- Google Cloud Console account

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: **AI Image Stylizer**
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in testing mode

### 1.2 Create OAuth Client ID

1. Application type: **Web application**
2. Name: **AI Image Stylizer**
3. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://your-production-domain.com
   ```
4. Authorized redirect URIs:
   ```
   https://ioasopowtifgaahldglq.supabase.co/auth/v1/callback
   http://localhost:5173
   https://your-production-domain.com
   ```
5. Click **Create**
6. **Save the Client ID and Client Secret** - you'll need these next

## Step 2: Configure Supabase Auth

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/project/ioasopowtifgaahldglq)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Toggle it to **Enabled**
5. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
6. Click **Save**

### 2.2 Configure Site URL

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://your-domain.com`)
3. Add **Redirect URLs**:
   ```
   http://localhost:5173
   https://your-production-domain.com
   ```

### 2.3 Email Settings (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize email templates if desired
3. Configure SMTP settings for production (optional)

## Step 3: Update Environment Variables (Optional)

If you want to use environment variables instead of hardcoded values:

1. Create or update `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://ioasopowtifgaahldglq.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Update `utils/supabaseClient.ts` to use env variables:
   ```typescript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

## Step 4: Test Authentication

### 4.1 Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Click **Sign in with Google**
4. Complete the Google OAuth flow
5. Verify you're signed in (should see your email in header)

### 4.2 Verify Database

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. You should see your user account listed
3. Check the `user_votes` table to ensure votes are being tracked with `user_id`

## Step 5: Production Deployment

### 5.1 Update Redirect URLs

Before deploying to production:

1. Update Google Cloud Console redirect URIs with your production domain
2. Update Supabase redirect URLs with your production domain
3. Update Site URL in Supabase to your production domain

### 5.2 Security Checklist

- ✅ OAuth credentials are not committed to git
- ✅ Production redirect URLs are configured
- ✅ Email verification is enabled (optional)
- ✅ Rate limiting is configured in Supabase
- ✅ RLS policies are properly set on database tables

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. App redirects to Google OAuth consent screen
3. User approves access
4. Google redirects back to Supabase callback URL
5. Supabase creates/updates user session
6. App receives authenticated user
7. User ID is stored in `user_votes` table for vote tracking

### Voting System Integration

- **Authenticated users**: Votes tracked by `user_id` (more reliable)
- **Anonymous users**: Votes tracked by `browser_id` (fallback)
- Database has unique constraints for both scenarios
- Users can only vote once per style per account

### Benefits

- **Better vote tracking**: User ID is consistent across devices
- **User profiles**: Can show user's vote history
- **Social features**: Can add user-specific features later
- **Analytics**: Better user engagement tracking

## Troubleshooting

### "Redirect URI mismatch" error

- Verify redirect URIs in Google Cloud Console match exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

### "Invalid client" error

- Double-check Client ID and Client Secret in Supabase
- Ensure Google OAuth credentials are active
- Verify project is published (not in testing mode)

### User not appearing in database

- Check Supabase logs: Dashboard > **Logs** > **Auth**
- Verify RLS policies allow inserts
- Check browser console for errors

### Session not persisting

- Verify `persistSession: true` in supabase client config
- Check localStorage is enabled in browser
- Clear browser cache and try again

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify all configuration steps were completed
4. Test with a different Google account
