# Authentication Callback Debug Guide

## Problem
User selects Google account, gets redirected back to the site, but authentication doesn't complete and the app returns to default state (not signed in).

## What Was Fixed

### 1. Enhanced OAuth Callback Handling
**File**: `contexts/AuthContext.tsx`

Added explicit OAuth callback detection and processing:
```typescript
// Check if we have auth tokens in the URL (from OAuth redirect)
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');

if (accessToken) {
  console.log('OAuth callback detected, processing tokens...');
  // Process the session and clean up URL
}
```

### 2. Improved Supabase Client Configuration
**File**: `utils/supabaseClient.ts`

Added:
- `flowType: 'pkce'` - Uses PKCE flow for better security and reliability
- `storageKey: 'ai-stylizer-auth'` - Custom storage key to avoid conflicts
- `debug: true` - Enables detailed auth logging in console

### 3. Better State Management
- Added console logging to track auth state changes
- Automatically cleans up URL hash after successful authentication
- Handles both OAuth callback and existing session scenarios

## How to Debug

### Step 1: Open Browser Console
Before clicking "Sign in with Google", open your browser's developer console (F12).

### Step 2: Watch for Logs
You should see these logs during the sign-in process:

1. **When clicking sign-in**: Nothing yet (redirect happens)
2. **After selecting Google account**: 
   ```
   OAuth callback detected, processing tokens...
   Session established successfully: your-email@gmail.com
   Auth state changed: SIGNED_IN your-email@gmail.com
   ```

### Step 3: Check for Errors
If authentication fails, you'll see error logs:
```
Error getting session after OAuth: [error details]
Error in auth callback handler: [error details]
```

## Common Issues & Solutions

### Issue 1: "Session established" log appears but user state doesn't update
**Cause**: React state not updating properly
**Solution**: Check that AuthProvider wraps the entire app in `index.tsx`

### Issue 2: No logs appear after redirect
**Cause**: Supabase not detecting the callback URL
**Solution**: 
- Verify `detectSessionInUrl: true` in supabaseClient.ts
- Check that redirect URL in Supabase matches exactly
- Clear localStorage and try again

### Issue 3: "Invalid session" or "Token expired" errors
**Cause**: Clock skew or invalid tokens
**Solution**:
- Check system time is correct
- Clear browser cache and localStorage
- Try in incognito mode

### Issue 4: Redirect happens but tokens not in URL
**Cause**: Supabase Site URL misconfigured
**Solution**:
- Go to Supabase Dashboard → Authentication → URL Configuration
- Verify Site URL matches your domain
- Add domain to Redirect URLs list

## Testing Checklist

### Local Testing
```bash
# 1. Clear localStorage
localStorage.clear()

# 2. Start dev server
npm run dev

# 3. Open browser console
# 4. Click "Sign in with Google"
# 5. Select account
# 6. Watch console logs
# 7. Verify avatar appears in header
```

### Production Testing
1. Deploy latest changes
2. Clear browser cache
3. Visit production site
4. Open console
5. Sign in with Google
6. Check logs and verify authentication

## What to Look For

### Successful Authentication Flow
```
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User selects account
4. Redirects back with tokens in URL hash:
   #access_token=...&expires_at=...&refresh_token=...
5. Console logs: "OAuth callback detected, processing tokens..."
6. Console logs: "Session established successfully: email@example.com"
7. Console logs: "Auth state changed: SIGNED_IN email@example.com"
8. URL hash is cleaned up (removed)
9. Avatar appears in header
10. "Profile" menu item appears in hamburger menu
```

### Failed Authentication Flow
```
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User selects account
4. Redirects back BUT:
   - No tokens in URL hash, OR
   - Tokens present but error in console, OR
   - No console logs appear
5. User state remains null
6. No avatar appears
```

## Manual Verification

### Check localStorage
```javascript
// In browser console
localStorage.getItem('ai-stylizer-auth')
// Should show auth session data if signed in
```

### Check Supabase Session
```javascript
// In browser console
supabase.auth.getSession().then(({data}) => console.log(data))
// Should show session with user data if signed in
```

### Check User State
```javascript
// In React DevTools
// Find AuthContext.Provider
// Check value.user and value.session
// Should not be null if signed in
```

## Advanced Debugging

### Enable Supabase Debug Mode
Already enabled with `debug: true` in supabaseClient.ts

This will log detailed auth operations:
- Token refresh attempts
- Session validation
- Storage operations
- Network requests

### Network Tab
1. Open DevTools → Network tab
2. Filter by "auth"
3. Look for requests to:
   - `supabase.co/auth/v1/token`
   - `supabase.co/auth/v1/user`
4. Check response status and body

### Check Cookies
Some browsers block third-party cookies which can affect OAuth:
1. Settings → Privacy → Cookies
2. Ensure cookies are enabled
3. Try disabling tracking prevention temporarily

## If Still Not Working

### Option 1: Clear Everything
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
// Then hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Option 2: Check Supabase Dashboard
1. Go to Supabase Dashboard
2. Authentication → Logs
3. Look for recent sign-in attempts
4. Check for error messages

### Option 3: Verify Google OAuth Setup
1. Google Cloud Console → Credentials
2. Check OAuth client is active
3. Verify redirect URIs include Supabase callback
4. Check consent screen is published

### Option 4: Test with Different Browser
Try signing in with:
- Chrome (incognito)
- Firefox (private)
- Safari (private)

This helps identify browser-specific issues.

## Expected Behavior After Fix

### Before Fix
```
User signs in → Redirects back → No logs → User state null → Not signed in ❌
```

### After Fix
```
User signs in → Redirects back → Logs appear → Session created → Avatar shows ✅
```

## Support Commands

```bash
# Check Supabase client version
npm list @supabase/supabase-js

# Update if needed
npm install @supabase/supabase-js@latest

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Contact Points

If issues persist after trying all solutions:
1. Check Supabase status: https://status.supabase.com
2. Review Supabase auth logs in dashboard
3. Test with a different Google account
4. Verify network isn't blocking OAuth redirects
