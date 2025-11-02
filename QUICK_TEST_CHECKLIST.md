# Quick Test Checklist - Profile Usage Tracking

## 🚀 Quick Start (5 minutes)

### 1. Open Console
Press **F12** to open browser developer console

### 2. Sign In
- Click "Sign in with Google"
- Select your account
- Look for: `✅ Session established successfully!`

### 3. Generate First Image
- Upload an image
- Apply "Anime" filter
- **Watch console for:**
  ```
  👤 User is authenticated, tracking prompt usage...
  📊 Recording prompt usage: {userId: "...", filterId: "anime", filterName: "Anime"}
  ✅ Creating new usage record
  ✅ Successfully created prompt usage record
  ```

### 4. Check Supabase
- Go to [Supabase Table Editor](https://app.supabase.com/project/seedglnzvhnbjwcfniup/editor)
- Open `user_prompt_usage` table
- **You should see:** 1 row with `usage_count: 1`

### 5. Generate Again (Same Filter)
- Apply "Anime" filter again
- **Watch console for:**
  ```
  ✅ Found existing record, incrementing from 1 to 2
  ✅ Successfully updated prompt usage
  ```

### 6. Check Supabase Again
- Refresh the table
- **You should see:** Same row now has `usage_count: 2`

### 7. Open Profile
- Open hamburger menu
- Click "Profile"
- **Watch console for:**
  ```
  📈 Loading profile usage stats for user: ...
  ✅ Loaded usage stats: {statsCount: 1, total: 2}
  ```

### 8. Verify Profile Display
**Should show:**
- Total Generations: **2**
- Styles Used: **1**
- Most Used: **Anime**
- Table row: Anime | 2 | [date] | [date]

---

## ✅ Success Indicators

| Check | Expected Result |
|-------|----------------|
| Console shows "👤 User is authenticated" | ✅ Tracking enabled |
| Console shows "📊 Recording prompt usage" | ✅ Function called |
| Console shows "✅ Successfully created/updated" | ✅ Database write succeeded |
| Supabase table has data | ✅ Data persisted |
| Profile loads stats | ✅ Read working |
| Numbers match | ✅ Accuracy confirmed |

---

## ❌ Common Problems

### Problem: Console shows "👻 User is anonymous"
**Fix:** Sign in with Google first

### Problem: No "📊 Recording" logs
**Fix:** Check that you're in production mode (not dev mode with API disabled)

### Problem: "❌ Error inserting prompt usage"
**Fix:** 
1. Check Supabase logs
2. Verify RLS policies exist
3. Run migration SQL again

### Problem: Profile shows "No usage data yet"
**Fix:**
1. Verify data exists in Supabase table
2. Check console for "✅ Loaded usage stats"
3. Verify user_id matches

---

## 🔍 Quick Debug Commands

### Check if signed in
```javascript
// In console
supabase.auth.getSession().then(({data}) => console.log('User:', data.session?.user?.email));
```

### Check table data
```sql
-- In Supabase SQL Editor
SELECT * FROM user_prompt_usage ORDER BY last_used_at DESC LIMIT 10;
```

### Manual test insert
```sql
-- In Supabase SQL Editor
INSERT INTO user_prompt_usage (user_id, filter_id, filter_name, usage_count)
VALUES (auth.uid(), 'test', 'Test', 1);
```

---

## 📊 Expected Data Flow

```
User generates image
    ↓
App.tsx calls recordPromptUsage()
    ↓
Service checks if record exists
    ↓
    ├─ Exists → UPDATE usage_count + 1
    └─ New → INSERT with usage_count = 1
    ↓
Data saved to Supabase
    ↓
Profile page reads data
    ↓
Stats displayed to user
```

---

## 🎯 Test Scenarios

### Scenario 1: First Time User
1. Sign in
2. Generate 1 image with "Anime"
3. **Expected:** 1 record, count = 1

### Scenario 2: Repeat User
1. Generate 3 more images with "Anime"
2. **Expected:** Same record, count = 4

### Scenario 3: Multiple Styles
1. Generate with "Vintage"
2. Generate with "Cyberpunk"
3. **Expected:** 3 records total (anime: 4, vintage: 1, cyberpunk: 1)

### Scenario 4: Profile View
1. Open profile
2. **Expected:** 
   - Total: 6
   - Styles: 3
   - Most Used: Anime
   - Table sorted by count

---

## 📝 Quick Notes

- **Tracking only works for signed-in users**
- **Anonymous users are not tracked**
- **Each filter application increments count**
- **Data persists across sessions**
- **Profile updates in real-time**

---

## 🆘 Need Help?

1. Check `PROFILE_TRACKING_TEST_GUIDE.md` for detailed testing
2. Check `PROFILE_FEATURE_GUIDE.md` for feature overview
3. Check Supabase logs for errors
4. Share console logs (redact sensitive info)
