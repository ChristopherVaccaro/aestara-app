# Production Authentication Redirect Fix

## Problem
When signing in with Google on production site, users are redirected to `http://localhost:3000` instead of staying on the production domain.

## Root Cause
The **Site URL** in Supabase is configured to `localhost:3000`, causing all OAuth redirects to go back to localhost regardless of where the sign-in was initiated.

## Solution

### Step 1: Update Supabase Site URL

1. Go to [Supabase Dashboard](https://app.supabase.com/project/seedglnzvhnbjwcfniup)
2. Navigate to **Authentication** → **URL Configuration**
3. Update **Site URL** to your production domain:
   ```
   https://your-production-domain.com
   ```
   ⚠️ **Important**: Replace with your actual production URL (e.g., `https://ai-stylizer.netlify.app`)

### Step 2: Add All Redirect URLs

In the same **URL Configuration** section, add ALL environments to **Redirect URLs**:

```
http://localhost:3000
http://localhost:5173
https://your-production-domain.com
```

This allows authentication to work in all environments.

### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Update **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5173
   https://your-production-domain.com
   ```

5. Verify **Authorized redirect URIs** includes:
   ```
   https://seedglnzvhnbjwcfniup.supabase.co/auth/v1/callback
   ```

### Step 4: Test

1. Clear browser cache and cookies
2. Visit your production site
3. Click "Sign in with Google"
4. Should now redirect back to production domain after authentication

## How It Works

### Before Fix
```
Production Site → Google OAuth → Supabase → localhost:3000 ❌
```

### After Fix
```
Production Site → Google OAuth → Supabase → Production Site ✅
Localhost → Google OAuth → Supabase → Localhost ✅
```

## Code Changes Made

Updated `contexts/AuthContext.tsx` to use dynamic redirect URL:
```typescript
const redirectUrl = window.location.origin;
```

This ensures the redirect URL matches the current environment automatically.

## Verification Checklist

- [ ] Supabase Site URL set to production domain
- [ ] All redirect URLs added in Supabase
- [ ] Google Cloud Console authorized origins updated
- [ ] Google Cloud Console redirect URI includes Supabase callback
- [ ] Tested sign-in on production
- [ ] Tested sign-in on localhost
- [ ] User avatar appears after sign-in
- [ ] Profile page accessible

## Common Issues

### Issue: Still redirecting to localhost
**Solution**: 
- Clear browser cache completely
- Check Supabase Site URL is saved correctly
- Wait 1-2 minutes for changes to propagate

### Issue: "Redirect URI mismatch" error
**Solution**:
- Verify exact match in Google Cloud Console
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Issue: Works on localhost but not production
**Solution**:
- Verify production domain is in Google authorized origins
- Check Supabase redirect URLs includes production domain
- Ensure Site URL is production domain, not localhost

## Environment-Specific URLs

### Development
- Site URL: Can be `http://localhost:5173` for local testing
- Redirect URLs: Include both localhost ports

### Production
- Site URL: Your production domain (e.g., `https://ai-stylizer.netlify.app`)
- Redirect URLs: Include production domain + localhost for development

## Best Practice

Set **Site URL** to production domain and add all development URLs to **Redirect URLs**. This way:
- Production users → Redirect to production
- Developers → Can still test locally
- One configuration works for all environments

## Testing Commands

```bash
# Test localhost
npm run dev
# Visit http://localhost:5173
# Sign in should redirect to localhost:5173

# Test production
# Deploy to production
# Visit production URL
# Sign in should redirect to production URL
```

## Support

If issues persist:
1. Check Supabase logs: Dashboard → **Logs** → **Auth**
2. Check browser console for errors
3. Verify Google OAuth consent screen is published
4. Try incognito/private browsing mode
