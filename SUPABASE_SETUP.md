# Supabase Global Voting System Setup

## Overview
Successfully migrated from localStorage to Supabase for a **global voting system** where all users contribute to the same vote pool. This enables data-driven prompt refinement across all users.

## Database Schema

### Tables Created

#### 1. `style_votes`
Global vote counts for each art style.

```sql
- id: UUID (primary key)
- filter_name: TEXT (unique) - e.g., "anime", "watercolor"
- thumbs_up: INTEGER (default 0)
- thumbs_down: INTEGER (default 0)
- total_votes: INTEGER (default 0)
- last_modified: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

#### 2. `user_votes`
Tracks individual user votes to prevent duplicates.

```sql
- id: UUID (primary key)
- browser_id: TEXT - Anonymous browser fingerprint
- filter_name: TEXT - Which style was voted on
- vote_type: TEXT - 'up' or 'down'
- voted_at: TIMESTAMPTZ
- UNIQUE(browser_id, filter_name) - One vote per user per style
```

#### 3. `prompt_overrides`
Stores AI-refined prompts after negative feedback threshold.

```sql
- id: UUID (primary key)
- filter_name: TEXT (unique)
- original_prompt: TEXT
- refined_prompt: TEXT
- reason: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Security (Row Level Security)

All tables have RLS enabled with public policies:
- **Read access**: All users can view vote counts and prompt overrides
- **Write access**: All users can insert votes and update counts
- No authentication required (anonymous voting)

## Browser Fingerprinting

**File**: `utils/browserFingerprint.ts`

Generates a unique anonymous ID for each browser/device:
- Combines: user agent, language, screen size, timezone, hardware
- Adds random component and timestamp
- Stores in localStorage for persistence
- Used to prevent duplicate votes per style

## Updated Services

### `voteTrackingService.ts`
All functions now use Supabase instead of localStorage:

**Key Changes**:
- All functions are now `async` and return `Promise<T>`
- `recordVote()` - Checks for duplicate votes before recording
- `hasUserVoted()` - New function to check if user already voted
- `needsRefinement()` - Queries Supabase for vote stats
- `getVoteStats()` - Fetches global vote counts
- `savePromptOverride()` - Saves refined prompts to database
- `getActivePrompt()` - Retrieves refined prompt if exists
- `resetVotes()` - Clears all votes after refinement

### `GenerationFeedback.tsx`
Updated to handle async voting:
- `handleVote()` is now async
- Shows alert if user already voted for that style
- Awaits vote recording and stats fetching

### `App.tsx`
Updated async calls:
- `await getActivePrompt()` - When applying filters
- `await needsRefinement()` - When checking for refinement
- `await getVoteStats()` - When fetching vote statistics
- `await savePromptOverride()` - When saving refined prompts

## Supabase Connection

**Project**: ioasopowtifgaahldglq
**URL**: https://ioasopowtifgaahldglq.supabase.co
**File**: `utils/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## How It Works

### 1. User Votes
1. User generates an image with a style
2. Clicks thumbs up/down on `GenerationFeedback` component
3. System checks if user already voted for this style
4. If not, records vote in `user_votes` table
5. Updates global count in `style_votes` table

### 2. Duplicate Prevention
- Browser fingerprint stored in localStorage
- `user_votes` table has UNIQUE constraint on (browser_id, filter_name)
- User can only vote once per style (globally)
- Attempting to vote again shows alert message

### 3. Automatic Refinement
When negative votes exceed threshold:
1. System detects 60%+ thumbs down ratio
2. Calls Gemini API to refine the prompt
3. Saves refined prompt to `prompt_overrides` table
4. Resets all votes for that style (fresh start)
5. Shows notification to user

### 4. Using Refined Prompts
- When applying a filter, system checks `prompt_overrides`
- If refined prompt exists, uses it instead of original
- Original prompts remain in code for reference

## Vote Thresholds

```typescript
// Development (localhost): 5 votes minimum
// Production: 20 votes minimum
export const VOTE_THRESHOLD = IS_DEVELOPMENT ? 5 : 20;

// 60% thumbs down triggers refinement
export const NEGATIVE_RATIO_THRESHOLD = 0.6;
```

## Testing

### Local Testing (Development Mode)
1. Set threshold to 5 votes (automatic on localhost)
2. Upload an image and apply a filter
3. Vote thumbs down 3-4 times (refresh browser to get new fingerprint)
4. On 5th vote with 60%+ negative, refinement triggers
5. Check console for refinement logs

### Production Testing
- Requires 20 votes minimum
- Same 60% negative threshold
- Real users contribute to global vote pool

## Database Queries

### View all votes
```sql
SELECT * FROM style_votes ORDER BY total_votes DESC;
```

### View user votes
```sql
SELECT * FROM user_votes ORDER BY voted_at DESC;
```

### View refined prompts
```sql
SELECT filter_name, reason, created_at FROM prompt_overrides;
```

### Clear all data (testing)
```sql
DELETE FROM user_votes;
DELETE FROM style_votes;
DELETE FROM prompt_overrides;
```

## Benefits

✅ **Global voting** - All users contribute to same vote pool
✅ **Spam prevention** - One vote per user per style
✅ **Anonymous** - No login required, browser fingerprinting
✅ **Self-improving** - Prompts automatically refine based on feedback
✅ **Persistent** - Data survives across sessions and devices
✅ **Scalable** - Supabase handles concurrent users
✅ **Real-time** - Vote counts update immediately

## Files Modified

- ✅ `services/voteTrackingService.ts` - Migrated to Supabase
- ✅ `components/GenerationFeedback.tsx` - Async vote handling
- ✅ `App.tsx` - Async function calls
- ✅ `utils/browserFingerprint.ts` - NEW: Browser ID generation
- ✅ `utils/supabaseClient.ts` - NEW: Supabase client config
- ✅ `package.json` - Added @supabase/supabase-js dependency

## Next Steps

1. **Monitor votes** - Check Supabase dashboard for vote activity
2. **Test refinement** - Trigger prompt refinement with test votes
3. **Analytics** - Track which styles get most votes
4. **Admin dashboard** - Build UI to view vote stats (optional)
5. **A/B testing** - Compare original vs refined prompts (optional)
