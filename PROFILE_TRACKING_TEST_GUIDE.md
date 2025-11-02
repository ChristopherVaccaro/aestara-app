# Profile Usage Tracking - Testing Guide

## Overview
This guide helps you verify that prompt usage tracking is working correctly and stats are accurately reflected in Supabase.

## Prerequisites
1. ✅ Database migration has been run (`SUPABASE_MIGRATION_USER_PROMPT_USAGE.sql`)
2. ✅ User is signed in with Google
3. ✅ Browser console is open (F12)

## Step-by-Step Testing

### Step 1: Verify Database Table Exists

**In Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://app.supabase.com/project/seedglnzvhnbjwcfniup)
2. Navigate to **Table Editor**
3. Look for `user_prompt_usage` table
4. Verify columns exist:
   - `id` (UUID)
   - `user_id` (UUID)
   - `filter_id` (TEXT)
   - `filter_name` (TEXT)
   - `usage_count` (INTEGER)
   - `first_used_at` (TIMESTAMPTZ)
   - `last_used_at` (TIMESTAMPTZ)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

### Step 2: Sign In and Generate First Image

**Actions:**
1. Open the app
2. Open browser console (F12)
3. Sign in with Google
4. Upload an image
5. Apply a filter (e.g., "Anime")

**Expected Console Logs:**
```
✅ OAuth callback detected! Processing tokens...
✅ Session established successfully!
👤 User is authenticated, tracking prompt usage...
📊 Recording prompt usage: {userId: "xxx", filterId: "anime", filterName: "Anime"}
✅ Creating new usage record
✅ Successfully created prompt usage record
```

### Step 3: Verify Data in Supabase

**In Supabase Dashboard:**
1. Go to **Table Editor** → `user_prompt_usage`
2. Click **Refresh** button
3. You should see a new row with:
   - Your `user_id`
   - `filter_id`: "anime"
   - `filter_name`: "Anime"
   - `usage_count`: 1
   - `first_used_at`: Current timestamp
   - `last_used_at`: Current timestamp

**Alternative - SQL Query:**
```sql
SELECT * FROM user_prompt_usage 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY last_used_at DESC;
```

### Step 4: Generate Second Image with Same Filter

**Actions:**
1. Apply the same filter again (e.g., "Anime")

**Expected Console Logs:**
```
👤 User is authenticated, tracking prompt usage...
📊 Recording prompt usage: {userId: "xxx", filterId: "anime", filterName: "Anime"}
✅ Found existing record, incrementing from 1 to 2
✅ Successfully updated prompt usage
```

**Verify in Supabase:**
- Same row should now have `usage_count`: 2
- `last_used_at` should be updated to new timestamp
- `first_used_at` should remain unchanged

### Step 5: Generate Image with Different Filter

**Actions:**
1. Apply a different filter (e.g., "Vintage")

**Expected Console Logs:**
```
👤 User is authenticated, tracking prompt usage...
📊 Recording prompt usage: {userId: "xxx", filterId: "vintage", filterName: "Vintage"}
✅ Creating new usage record
✅ Successfully created prompt usage record
```

**Verify in Supabase:**
- New row created for "vintage" filter
- `usage_count`: 1
- Both "anime" and "vintage" rows exist

### Step 6: Check Profile Page

**Actions:**
1. Open hamburger menu
2. Click "Profile"

**Expected Console Logs:**
```
📈 Loading profile usage stats for user: xxx
✅ Loaded usage stats: {statsCount: 2, total: 3}
Stats details: [
  {filter_id: "anime", filter_name: "Anime", usage_count: 2, ...},
  {filter_id: "vintage", filter_name: "Vintage", usage_count: 1, ...}
]
```

**Expected Profile Display:**
- **Total Generations**: 3 (2 anime + 1 vintage)
- **Styles Used**: 2 (anime, vintage)
- **Most Used**: Anime

**Usage Table:**
| Style Name | Times Used | First Used | Last Used |
|------------|------------|------------|-----------|
| Anime      | 2          | [date]     | [date]    |
| Vintage    | 1          | [date]     | [date]    |

## Common Issues & Solutions

### Issue 1: No console logs appear when generating image

**Possible Causes:**
- User not signed in
- Console is filtered

**Solutions:**
1. Verify user is signed in (check for avatar in header)
2. Clear console filters
3. Check for "👤 User is authenticated" log

### Issue 2: "Creating new usage record" but no data in Supabase

**Possible Causes:**
- RLS policies blocking insert
- User ID mismatch
- Database permissions issue

**Solutions:**
1. Check Supabase logs: Dashboard → **Logs** → **Database**
2. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'user_prompt_usage';
   ```
3. Test insert manually:
   ```sql
   INSERT INTO user_prompt_usage (user_id, filter_id, filter_name, usage_count)
   VALUES (auth.uid(), 'test', 'Test', 1);
   ```

### Issue 3: Usage count not incrementing

**Possible Causes:**
- Update query failing
- Unique constraint issue
- RLS policy blocking update

**Solutions:**
1. Check console for "❌ Error updating prompt usage"
2. Verify unique index exists:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename = 'user_prompt_usage';
   ```
3. Test update manually:
   ```sql
   UPDATE user_prompt_usage 
   SET usage_count = usage_count + 1 
   WHERE user_id = auth.uid() AND filter_id = 'anime';
   ```

### Issue 4: Profile shows "No usage data yet"

**Possible Causes:**
- Data not saved to database
- RLS policy blocking read
- User ID mismatch

**Solutions:**
1. Check console for "✅ Loaded usage stats"
2. Verify data exists in Supabase
3. Check RLS policies allow SELECT:
   ```sql
   SELECT * FROM user_prompt_usage WHERE user_id = auth.uid();
   ```

## Manual Database Verification

### Check Total Records
```sql
SELECT COUNT(*) as total_records 
FROM user_prompt_usage;
```

### Check Records for Specific User
```sql
SELECT 
  filter_name,
  usage_count,
  first_used_at,
  last_used_at
FROM user_prompt_usage
WHERE user_id = 'YOUR_USER_ID'
ORDER BY usage_count DESC;
```

### Check Total Usage for User
```sql
SELECT 
  COUNT(DISTINCT filter_id) as unique_styles,
  SUM(usage_count) as total_generations
FROM user_prompt_usage
WHERE user_id = 'YOUR_USER_ID';
```

### Check Most Recent Activity
```sql
SELECT 
  filter_name,
  usage_count,
  last_used_at
FROM user_prompt_usage
WHERE user_id = 'YOUR_USER_ID'
ORDER BY last_used_at DESC
LIMIT 5;
```

## Testing Checklist

- [ ] Database table `user_prompt_usage` exists
- [ ] User can sign in successfully
- [ ] Console shows "👤 User is authenticated" when generating
- [ ] Console shows "📊 Recording prompt usage" with correct data
- [ ] First generation creates new record in database
- [ ] Second generation with same filter increments count
- [ ] Different filter creates separate record
- [ ] Profile page loads without errors
- [ ] Profile shows correct total generations
- [ ] Profile shows correct number of styles used
- [ ] Profile shows correct most used style
- [ ] Usage table displays all filters used
- [ ] Usage table shows correct counts
- [ ] Usage table shows correct dates
- [ ] Table is sorted by usage count (descending)

## Expected Console Output (Full Flow)

```
🔐 Auth initialization starting...
✅ Existing session found: user@example.com
👤 User is authenticated, tracking prompt usage...
📊 Recording prompt usage: {userId: "abc-123", filterId: "anime", filterName: "Anime"}
✅ Creating new usage record
✅ Successfully created prompt usage record

[Apply same filter again]
👤 User is authenticated, tracking prompt usage...
📊 Recording prompt usage: {userId: "abc-123", filterId: "anime", filterName: "Anime"}
✅ Found existing record, incrementing from 1 to 2
✅ Successfully updated prompt usage

[Open profile]
📈 Loading profile usage stats for user: abc-123
✅ Loaded usage stats: {statsCount: 1, total: 2}
Stats details: [{filter_id: "anime", filter_name: "Anime", usage_count: 2, ...}]
```

## Performance Notes

- Each generation makes 2 database calls:
  1. SELECT to check existing record
  2. INSERT or UPDATE based on result
- Profile page makes 2 queries:
  1. Get all usage stats
  2. Get total usage count
- All queries use indexes for fast lookups
- RLS policies ensure data isolation per user

## Troubleshooting Commands

### Clear localStorage and test fresh
```javascript
localStorage.clear();
window.location.reload();
```

### Check current session
```javascript
supabase.auth.getSession().then(({data}) => console.log(data));
```

### Manually test recording
```javascript
// In browser console (after signing in)
import { recordPromptUsage } from './services/userPromptUsageService';
recordPromptUsage('YOUR_USER_ID', 'test', 'Test Filter');
```

## Success Criteria

✅ **Tracking Works** if:
- Console logs show successful recording
- Data appears in Supabase table
- Usage count increments correctly
- Profile displays accurate stats

✅ **Profile Works** if:
- Stats load without errors
- Numbers match database
- Table displays all filters
- Sorting is correct (most used first)

## Support

If issues persist:
1. Share console logs (redact sensitive data)
2. Share Supabase table screenshot
3. Check Supabase Dashboard → **Logs** → **Database**
4. Verify RLS policies are correct
5. Test in incognito mode
