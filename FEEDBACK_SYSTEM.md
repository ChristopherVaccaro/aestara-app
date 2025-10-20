# Generation Feedback & Auto-Prompt Refinement System

## Overview
This system allows users to rate AI-generated images with thumbs up/down votes, automatically tracking feedback and using AI to refine underperforming style prompts. **Uses Supabase for global voting** - all users contribute to the same vote pool.

## How It Works

### 1. **User Voting**
- After each generation, a thumbs up/down component appears below the image
- Users can vote **once per style** (globally) using browser fingerprinting
- Votes are tracked in Supabase database (global vote pool)
- Anonymous voting - no login required

### 2. **Vote Thresholds**
The system uses different thresholds for development vs production:

- **Development** (localhost): 5 votes minimum
- **Production**: 20 votes minimum
- **Negative ratio threshold**: 60% thumbs down triggers refinement

This allows you to test the system with fewer votes during development.

### 3. **Automatic Prompt Refinement**
When a style receives too many negative votes:

1. System detects threshold exceeded (`needsRefinement()`)
2. Calls Gemini API to analyze the prompt and feedback stats
3. Gemini generates an improved prompt based on:
   - Common issues (complexity, safety filters, clarity)
   - Vote statistics (thumbs up/down ratio)
   - Best practices for the image generation API
4. Saves the refined prompt as an override
5. **Resets vote counts** for that style to start fresh
6. Shows notification to user about the improvement

### 4. **Prompt Override System**
- Refined prompts are stored in localStorage
- When a filter is applied, system checks for overrides first
- If override exists, uses refined prompt instead of original
- Original prompts remain unchanged in code

## Components

### `GenerationFeedback.tsx`
- Thumbs up/down UI component
- Shows after successful generation
- Animated feedback and vote confirmation
- Dev mode logging of vote statistics

### `voteTrackingService.ts`
Core voting logic with functions:
- `recordVote()` - Save user votes
- `needsRefinement()` - Check if style needs improvement
- `getVoteStats()` - Get current vote counts
- `savePromptOverride()` - Store refined prompts
- `getActivePrompt()` - Get current prompt (override or original)
- `resetVotes()` - Clear votes after refinement

### `geminiService.ts`
Added `refinePrompt()` function:
- Uses Gemini 2.0 Flash for fast text generation
- Analyzes original prompt and vote statistics
- Returns improved prompt text
- Focuses on clarity, safety, and effectiveness

## Data Storage

### Supabase Tables

#### `style_votes` - Global vote counts
```sql
- filter_name: TEXT (unique) - e.g., "anime", "watercolor"
- thumbs_up: INTEGER
- thumbs_down: INTEGER
- total_votes: INTEGER
- last_modified: TIMESTAMPTZ
```

#### `user_votes` - Individual vote tracking
```sql
- browser_id: TEXT - Anonymous browser fingerprint
- filter_name: TEXT
- vote_type: TEXT - 'up' or 'down'
- voted_at: TIMESTAMPTZ
- UNIQUE(browser_id, filter_name) - Prevents duplicate votes
```

#### `prompt_overrides` - Refined prompts
```sql
- filter_name: TEXT (unique)
- original_prompt: TEXT
- refined_prompt: TEXT
- reason: TEXT
- created_at: TIMESTAMPTZ
```

## Testing During Development

1. **Enable Dev Mode** using the toggle (bottom-right corner)
2. Upload a sample image (or use the dev mode placeholder)
3. Apply a filter and vote thumbs down
4. **Clear browser fingerprint** to vote again: `localStorage.removeItem('aiImageStylizer_browserId')`
5. Repeat steps 3-4 until you have 5 votes with 60%+ negative
6. Refinement will trigger automatically
7. Check console for refinement logs
8. Try the filter again to see the refined prompt in action

**Note**: In production, each user can only vote once per style globally.

## Vote Behavior

### Positive Votes (Thumbs Up)
- Indicates good generation quality
- System keeps using the current prompt
- No action taken, just tracked

### Negative Votes (Thumbs Down)
- Indicates poor generation quality
- Accumulates toward refinement threshold
- Once threshold met, triggers auto-refinement
- Votes reset after refinement

### No Vote
- User doesn't vote on a generation
- Has no effect on the system
- Style continues using current prompt

## Benefits

1. **Self-Improving System**: Prompts get better over time based on real user feedback
2. **No Manual Intervention**: Refinement happens automatically
3. **Transparent**: Users see notification when improvements are made
4. **Data-Driven**: Uses actual vote statistics, not guesses
5. **Preserves Originals**: Original prompts remain in code for reference
6. **Incremental**: Each style improves independently

## Monitoring

### Console Logs (Dev Mode)
After each vote:
```
📊 anime votes: {
  thumbsUp: 2,
  thumbsDown: 3,
  total: 5,
  threshold: 5,
  needsMore: 0
}
```

When refinement triggers:
```
🔧 Refining prompt for Anime due to 3 negative votes...
✨ Prompt refined for Anime:
  original: "Apply anime illustration style rendering..."
  refined: "Render in clean anime aesthetic with..."
✅ Prompt refined and saved for Anime
```

## Future Enhancements

Potential improvements you could add:

1. **Admin Dashboard**: View all vote stats and overrides
2. **A/B Testing**: Test refined vs original prompts
3. **Export/Import**: Share successful prompts across deployments
4. **Analytics**: Track improvement metrics over time
5. **Manual Override**: Allow manual prompt editing
6. **Rollback**: Ability to revert to previous prompt versions

## Resetting the System

### Clear all vote data (Supabase)
```javascript
import { clearAllVoteData } from './services/voteTrackingService';
await clearAllVoteData(); // Call in browser console
```

### Clear your browser fingerprint (test multiple votes)
```javascript
localStorage.removeItem('aiImageStylizer_browserId');
```

### Database queries (Supabase dashboard)
```sql
-- Clear all votes
DELETE FROM user_votes;
DELETE FROM style_votes;
DELETE FROM prompt_overrides;
```
