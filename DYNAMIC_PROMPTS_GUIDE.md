# Dynamic AI Prompt Refinement System

## Overview

Your AI Image Stylizer now features an **automatic prompt refinement system** that uses Gemini AI to improve prompts based on user feedback. When a style receives -5 net feedback (more thumbs down than thumbs up), the AI automatically rewrites the prompt to generate better results.

## Key Features

✅ **Prompts stored in Supabase** - Easy to manage and update  
✅ **Automatic AI refinement** - When net feedback ≤ -5, Gemini rewrites the prompt  
✅ **Version tracking** - Every refinement increments version number  
✅ **Historical data** - All votes and refinements tracked for analytics  
✅ **Zero downtime** - Falls back to hardcoded prompts if DB unavailable  
✅ **Background processing** - Refinement doesn't block user votes  

---

## Setup Instructions

### 1. Run the Database Migration

Open Supabase SQL Editor and run:
```
https://supabase.com/dashboard/project/seedglnzvhnbjwcfniup/sql
```

Copy and paste the entire contents of `SUPABASE_MIGRATION_PROMPTS.sql` and execute it.

This creates:
- `style_prompts` table for storing prompts
- Indexes for performance
- Row-level security policies
- SQL function for updating generation counts
- Triggers for automatic timestamp updates

### 2. Seed Initial Prompts

**Option A: Browser Console (Recommended)**
1. Start your dev server: `npm run dev`
2. Open your app in browser
3. Open Developer Console (F12)
4. Import and run the seeding function:
   ```javascript
   import { seedPromptsToDatabase } from './utils/seedPrompts';
   seedPromptsToDatabase();
   ```

**Option B: Add to App Initialization**
Add this to your `App.tsx` (temporary, remove after seeding):
```typescript
useEffect(() => {
  const seedOnce = async () => {
    const hasSeeded = localStorage.getItem('prompts_seeded');
    if (!hasSeeded) {
      const allFilters = FILTER_CATEGORIES.flatMap(cat => cat.filters);
      await seedAllPrompts(allFilters);
      localStorage.setItem('prompts_seeded', 'true');
      console.log('✅ Prompts seeded successfully');
    }
  };
  seedOnce();
}, []);
```

### 3. Verify Setup

Check your Supabase dashboard:
```
https://supabase.com/dashboard/project/seedglnzvhnbjwcfniup/editor
```

You should see:
- `style_prompts` table with 90+ rows (one per filter)
- Each row has `filter_id`, `current_prompt`, `version: 1`, `net_feedback: 0`

---

## How It Works

### Architecture

```
User votes thumbs down
    ↓
Vote recorded in user_votes table
    ↓
style_votes table updated (global count)
    ↓
style_prompts.net_feedback updated (+1 or -1)
    ↓
If net_feedback <= -5:
    ↓
Gemini AI analyzes prompt + feedback stats
    ↓
AI generates refined prompt
    ↓
style_prompts.current_prompt updated
    ↓
version incremented, net_feedback reset to 0
    ↓
Future generations use new prompt
```

### Vote Tracking

**Current System (Preserved):**
- Users vote once per generation (UI enforced)
- All votes recorded in database
- No duplicate restrictions at DB level
- Votes persist across sessions

**New Addition:**
- `net_feedback` tracked per style in `style_prompts` table
- Net feedback = thumbs up - thumbs down
- When ≤ -5, auto-refinement triggers

### Database Schema

**style_prompts table:**
```sql
- id: UUID (primary key)
- filter_id: TEXT (unique) - e.g., "anime", "watercolor"
- filter_name: TEXT - Display name
- current_prompt: TEXT - Active prompt text
- version: INTEGER - Incremented on each refinement
- net_feedback: INTEGER - Running count (up - down)
- total_generations: INTEGER - Usage analytics
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_refinement_at: TIMESTAMP
- refinement_reason: TEXT
```

**Modified user_votes table:**
- Added `prompt_version` column (tracks which version was voted on)

---

## Refinement Logic

### Trigger Conditions

Automatic refinement happens when:
1. A user votes on a generation
2. Net feedback reaches ≤ -5
3. `filterId` and `currentPrompt` are available

### AI Refinement Prompt

Gemini receives:
```
FILTER NAME: [style name]
CURRENT PROMPT: [existing prompt]

FEEDBACK STATS:
- Thumbs Up: [count]
- Thumbs Down: [count]
- Negative Ratio: [percentage]

Your task: Refine this prompt to produce better results.
Consider:
1. Is the prompt too complex or vague?
2. Does it contain words that trigger safety filters?
3. Could the style description be more specific?
4. Are there conflicting instructions?
5. Would simpler, more direct language work better?
```

### Post-Refinement

When refinement completes:
- New prompt saved to `style_prompts.current_prompt`
- `version` incremented
- `net_feedback` reset to 0 (fresh start for new version)
- `last_refinement_at` timestamp updated
- **Historical votes NOT deleted** (kept for analytics)

---

## Code Changes Summary

### New Files

1. **services/promptService.ts**
   - `getPrompt(filterId)` - Fetch prompt from DB
   - `updatePrompt(filterId, newPrompt, reason)` - Save refined prompt
   - `updateNetFeedback(filterId, delta)` - Update vote count
   - `incrementGenerationCount(filterId)` - Track usage
   - `seedPrompt(filter)` - Insert initial prompt
   - `refreshPromptCache()` - 5-minute cache for performance

2. **utils/seedPrompts.ts**
   - Utility for seeding all prompts to database
   - Exposes `window.seedPrompts()` for browser console

3. **SUPABASE_MIGRATION_PROMPTS.sql**
   - Complete database migration
   - Creates tables, indexes, policies, functions

4. **DYNAMIC_PROMPTS_GUIDE.md** (this file)
   - Complete documentation

### Modified Files

1. **services/voteTrackingService.ts**
   - `recordVote()` now accepts `filterId` and `currentPrompt`
   - Added `triggerAutoRefinement()` function
   - Calls Gemini when net feedback ≤ -5
   - Updates run in background (non-blocking)

2. **components/GenerationFeedback.tsx**
   - Props updated to accept `filterId` and `currentPrompt`
   - Passes these to `recordVote()`

3. **App.tsx**
   - Added imports for promptService functions
   - `useEffect` to initialize prompt cache on mount
   - `handleApplyFilter()` now fetches prompt from DB
   - Falls back to hardcoded prompt if DB unavailable
   - Tracks `currentPromptUsed` for voting
   - Passes `filterId` and `currentPromptUsed` to GenerationFeedback

---

## Testing the System

### Manual Testing

1. **Verify prompt fetching:**
   ```javascript
   import { getPrompt } from './services/promptService';
   const prompt = await getPrompt('anime');
   console.log(prompt);
   ```

2. **Check net feedback:**
   ```sql
   SELECT filter_id, filter_name, net_feedback, version
   FROM style_prompts
   ORDER BY net_feedback ASC;
   ```

3. **Trigger refinement manually:**
   ```javascript
   // In browser console, simulate poor feedback
   import { recordVote } from './services/voteTrackingService';
   
   // Vote down 5 times on same style
   for (let i = 0; i < 5; i++) {
     await recordVote('anime', false, `test_${i}`, 'anime', 'your prompt here');
   }
   // Check console for "🤖 Auto-refinement triggered..."
   ```

### Development vs Production

**Threshold (in voteTrackingService.ts):**
- Development (localhost): 5 minimum votes
- Production: 20 minimum votes

**Net Feedback Trigger:**
- Both environments: ≤ -5 triggers refinement

---

## Monitoring & Analytics

### Check Prompt Versions

```sql
SELECT 
  filter_id,
  filter_name,
  version,
  net_feedback,
  total_generations,
  last_refinement_at,
  refinement_reason
FROM style_prompts
ORDER BY version DESC;
```

### View Refinement History

```sql
SELECT 
  filter_id,
  filter_name,
  version,
  refinement_reason,
  last_refinement_at
FROM style_prompts
WHERE version > 1
ORDER BY last_refinement_at DESC;
```

### Vote Analytics by Version

```sql
SELECT 
  uv.filter_name,
  uv.prompt_version,
  COUNT(*) as total_votes,
  SUM(CASE WHEN uv.vote_type = 'up' THEN 1 ELSE 0 END) as thumbs_up,
  SUM(CASE WHEN uv.vote_type = 'down' THEN 1 ELSE 0 END) as thumbs_down
FROM user_votes uv
GROUP BY uv.filter_name, uv.prompt_version
ORDER BY uv.filter_name, uv.prompt_version;
```

### Most Improved Styles

```sql
SELECT 
  sp.filter_name,
  sp.version,
  sp.net_feedback as current_feedback,
  sp.total_generations,
  sp.refinement_reason
FROM style_prompts sp
WHERE sp.version > 1 AND sp.net_feedback > 0
ORDER BY sp.net_feedback DESC;
```

---

## Adding New Styles

When you add a new filter to App.tsx:

1. Add filter to `FILTER_CATEGORIES` in App.tsx
2. Create corresponding entry in database:

```javascript
import { seedPrompt } from './services/promptService';

const newFilter = {
  id: 'new_style',
  name: 'New Style',
  prompt: 'Your prompt here...'
};

await seedPrompt(newFilter);
```

Or re-run full seeding process.

---

## Troubleshooting

### Prompts not updating after refinement

1. Check browser console for errors
2. Verify cache refresh: `refreshPromptCache()` runs every 5 minutes
3. Manual refresh: `import { refreshPromptCache } from './services/promptService'; await refreshPromptCache();`

### Refinement not triggering

1. Check `net_feedback` in database: `SELECT * FROM style_prompts WHERE filter_id = 'your_filter';`
2. Verify `filterId` and `currentPrompt` are passed to `recordVote()`
3. Check browser console for "🤖 Auto-refinement triggered..." message

### Database connection issues

- App falls back to hardcoded prompts automatically
- Check Supabase project status: https://status.supabase.com/
- Verify Supabase client config in `utils/supabaseClient.ts`

---

## Future Enhancements

Potential improvements:

1. **Admin Dashboard** - View/edit prompts directly in UI
2. **A/B Testing** - Test multiple prompt versions simultaneously
3. **User Feedback Comments** - Collect specific feedback reasons
4. **Batch Refinement** - Refine multiple poor-performing prompts at once
5. **Rollback Feature** - Revert to previous prompt version
6. **Performance Metrics** - Track generation success rate per version
7. **Prompt Templates** - Reusable prompt structures across styles

---

## Best Practices

### DO:
✅ Monitor refinements in first few weeks  
✅ Review AI-generated prompts for quality  
✅ Keep historical vote data for analytics  
✅ Test new filters before deploying to production  
✅ Back up your `style_prompts` table regularly  

### DON'T:
❌ Delete historical votes (breaks analytics)  
❌ Manually edit prompts without incrementing version  
❌ Set refinement threshold too low (causes churn)  
❌ Remove fallback to hardcoded prompts  
❌ Forget to seed new filters to database  

---

## Support & Questions

For issues or questions:
1. Check browser console for error messages
2. Check Supabase logs in dashboard
3. Review this guide's troubleshooting section
4. Verify all migration steps completed

---

## Summary

Your app now has a self-improving prompt system powered by AI:

🎯 **Automatic** - No manual intervention needed  
📊 **Data-Driven** - Decisions based on real user feedback  
🔄 **Continuous** - Improves over time as more users vote  
⚡ **Fast** - Cached prompts, background refinement  
🛡️ **Reliable** - Fallbacks ensure zero downtime  

**The system is production-ready!** Just run the migration and seed your prompts.
