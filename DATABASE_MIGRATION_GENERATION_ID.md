# Database Migration: Add generation_id to user_votes

## Overview
This migration adds a `generation_id` column to the `user_votes` table to support per-generation voting instead of per-style with time restrictions.

## Changes Required

### 1. Add generation_id column to user_votes table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add generation_id column to user_votes table
ALTER TABLE user_votes 
ADD COLUMN generation_id TEXT;

-- Create index on generation_id for faster lookups
CREATE INDEX idx_user_votes_generation_id ON user_votes(generation_id);

-- Update the unique constraint to include generation_id
-- First, drop the old constraints
DROP INDEX IF EXISTS user_votes_user_id_filter_name_key;
DROP INDEX IF EXISTS user_votes_browser_id_filter_name_key;

-- Create new unique constraints that include generation_id
CREATE UNIQUE INDEX user_votes_user_id_filter_name_generation_key 
ON user_votes(user_id, filter_name, generation_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX user_votes_browser_id_filter_name_generation_key 
ON user_votes(browser_id, filter_name, generation_id) 
WHERE user_id IS NULL;
```

## What This Changes

### Before (Per-Style with 2-hour window):
- Users could vote once per style every 2 hours
- Voting on "Anime" would block voting on "Anime" again for 2 hours
- Users could still vote on other styles immediately

### After (Per-Generation):
- Users can vote once per image generation
- Applying "Anime" style multiple times creates multiple generations
- Each generation can be voted on independently
- No time restrictions - immediate feedback on each result

## Benefits

1. **More Accurate Feedback**: Each generation gets its own vote, even for the same style
2. **Better UX**: No confusing 2-hour wait messages
3. **Iterative Improvement**: Users can vote on improvements when re-applying styles
4. **Simpler Logic**: No time-based checks needed

## Testing

After running the migration:

1. Apply a style (e.g., "Anime") to an image
2. Vote thumbs up or down
3. Apply the same style again (new generation)
4. You should be able to vote again on the new result
5. Try voting twice on the same generation - should be blocked

## Rollback (if needed)

```sql
-- Remove generation_id column
ALTER TABLE user_votes DROP COLUMN generation_id;

-- Restore old unique constraints
CREATE UNIQUE INDEX user_votes_user_id_filter_name_key 
ON user_votes(user_id, filter_name) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX user_votes_browser_id_filter_name_key 
ON user_votes(browser_id, filter_name) 
WHERE user_id IS NULL;
```
