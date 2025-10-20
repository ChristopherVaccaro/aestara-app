# Tag-Based Feedback System Guide

## Overview

Your AI Image Stylizer now has a **detailed tag-based feedback system** that collects specific user feedback when they vote down a generation. Instead of just thumbs up/down, users can select from 18 predefined tags explaining exactly what went wrong.

This enables **much more targeted AI prompt refinements** based on real user issues.

---

## Key Features

✅ **18 Predefined Feedback Tags** - Organized into 4 categories  
✅ **Modal Selection UI** - Beautiful tag selector appears on thumbs down  
✅ **Optional Feedback** - Users can skip tags and just vote down  
✅ **AI Integration** - Tag data passed to Gemini for smarter refinements  
✅ **Analytics Ready** - Track which issues are most common per style  
✅ **Aggregated Summaries** - JSONB column stores tag counts per filter  

---

## Database Schema

### **New Tables**

#### 1. `feedback_tags`
Stores predefined feedback options:
```sql
- id: UUID (primary key)
- tag_key: TEXT (unique) - e.g., "too_blurry"
- tag_label: TEXT - Display name "Too Blurry"
- tag_description: TEXT - Helpful description for users
- category: TEXT - 'quality', 'style', 'preservation', 'technical'
- sort_order: INTEGER - Display order
- is_active: BOOLEAN - Can be disabled without deleting
- created_at: TIMESTAMP
```

#### 2. `vote_feedback`
Links votes to selected tags:
```sql
- id: UUID (primary key)
- user_vote_id: UUID (references user_votes.id)
- tag_id: UUID (references feedback_tags.id)
- created_at: TIMESTAMP
- UNIQUE(user_vote_id, tag_id) - One tag per vote
```

#### 3. `style_prompts` (updated)
Added column:
```sql
- feedback_summary: JSONB - Aggregated tag counts
  Example: {"too_blurry": 5, "lost_face": 3, "wrong_style": 2}
```

---

## Available Feedback Tags

### **Quality Issues** (5 tags)
1. **Too Blurry** - Result lacks sharpness and detail
2. **Too Abstract** - Style is too abstract or unrecognizable
3. **Low Quality** - Overall quality is poor
4. **Visual Artifacts** - Strange artifacts or glitches in the image
5. **Colors Off** - Colors are too saturated, muted, or incorrect

### **Style Issues** (4 tags)
6. **Wrong Style** - Does not match the expected art style
7. **Inconsistent Style** - Style is applied unevenly
8. **Too Subtle** - Style transformation is too subtle
9. **Over-Stylized** - Style is too heavy-handed or exaggerated

### **Preservation Issues** (5 tags)
10. **Lost Facial Features** - Face structure or features are distorted
11. **Changed Expression** - Facial expression was altered incorrectly
12. **Lost Important Details** - Clothing, accessories, or background details lost
13. **Wrong Proportions** - Body or facial proportions are incorrect
14. **Person Unrecognizable** - The person no longer looks like themselves

### **Technical Issues** (4 tags)
15. **Safety Filter Triggered** - Result was blocked or censored
16. **Incomplete Generation** - Image appears unfinished
17. **Composition Changed** - Overall layout or framing was altered
18. **Lighting Problems** - Lighting is too harsh, flat, or incorrect

---

## User Experience Flow

### **1. Thumbs Up Vote**
- User clicks thumbs up
- Vote recorded immediately
- "Thanks for your feedback!" message shown
- No tag selector needed

### **2. Thumbs Down Vote**
- User clicks thumbs down
- Vote recorded to database
- **Tag selector modal opens automatically**
- User sees 18 tags grouped by category
- User can:
  - Select multiple tags (checkboxes)
  - Skip and submit with no tags
  - Close modal (still counts as downvote)
- Selected tags linked to vote in `vote_feedback` table
- Feedback summary updated in background

### **3. New Generation**
- User generates new image
- Vote state resets (can vote again)
- Tag selector resets for fresh feedback

---

## How AI Refinement Uses Tags

### **Before (Simple Feedback)**
```javascript
refinePrompt(filterName, prompt, 5 thumbsUp, 12 thumbsDown)
// AI only knew: "More people disliked it"
```

### **After (Tag-Based Feedback)**
```javascript
refinePrompt(filterName, prompt, 5, 12, `
SPECIFIC USER-REPORTED ISSUES:
1. Too Blurry (8 reports): Result lacks sharpness and detail
2. Lost Facial Features (6 reports): Face structure distorted
3. Colors Off (4 reports): Colors too saturated or muted

Focus on addressing these specific issues.
`)
// AI knows EXACTLY what to fix!
```

### **Benefits**
- AI can target specific problems (blur, color, preservation)
- Refinements are data-driven, not guesswork
- Users feel heard (their feedback directly improves prompts)
- Faster improvements with fewer iterations

---

## Code Architecture

### **New Files Created**

1. **`services/feedbackTagService.ts`**
   - `getAllFeedbackTags()` - Fetch all active tags
   - `getTagsByCategory()` - Group tags by category
   - `recordVoteFeedback(voteId, tagIds)` - Link tags to vote
   - `getFeedbackSummary(filterId)` - Get aggregated counts
   - `updateFeedbackSummary(filterId)` - Recalculate summary
   - `getTopFeedbackIssues(filterId, limit)` - Get most reported issues
   - `getFeedbackStats(filterId)` - Detailed analytics

2. **`components/FeedbackTagSelector.tsx`**
   - Modal UI component
   - Category-based tag display with icons
   - Multi-select checkboxes
   - Skip/Submit buttons
   - Responsive design (mobile-friendly)

3. **`SUPABASE_MIGRATION_FEEDBACK_TAGS.sql`**
   - Complete database migration
   - Creates tables, indexes, policies, functions
   - Seeds initial 18 tags

4. **`FEEDBACK_TAGS_GUIDE.md`** (this file)
   - Complete documentation

### **Modified Files**

1. **`components/GenerationFeedback.tsx`**
   - Shows `FeedbackTagSelector` modal on thumbs down
   - Passes vote ID to tag selector
   - Calls `recordVoteFeedback()` with selected tags
   - Updates feedback summary in background

2. **`services/voteTrackingService.ts`**
   - `recordVote()` now returns vote ID (string | null)
   - `triggerAutoRefinement()` fetches top feedback issues
   - Passes detailed tag context to Gemini AI
   - Includes top issues in refinement reason

3. **`services/geminiService.ts`**
   - `refinePrompt()` accepts new `feedbackContext` parameter
   - Includes user-reported issues in AI prompt
   - AI specifically addresses tagged problems

---

## Analytics & Monitoring

### **Check Tag Usage**
```sql
SELECT 
  ft.tag_label,
  ft.category,
  COUNT(vf.id) as usage_count
FROM feedback_tags ft
LEFT JOIN vote_feedback vf ON vf.tag_id = ft.id
GROUP BY ft.id, ft.tag_label, ft.category
ORDER BY usage_count DESC;
```

### **Top Issues Per Filter**
```sql
SELECT 
  uv.filter_name,
  ft.tag_label,
  COUNT(*) as report_count
FROM vote_feedback vf
JOIN user_votes uv ON uv.id = vf.user_vote_id
JOIN feedback_tags ft ON ft.id = vf.tag_id
WHERE uv.filter_name = 'anime'
GROUP BY uv.filter_name, ft.tag_label
ORDER BY report_count DESC
LIMIT 5;
```

### **Feedback Summary Per Style**
```sql
SELECT 
  filter_id,
  filter_name,
  feedback_summary
FROM style_prompts
WHERE feedback_summary != '{}'::jsonb
ORDER BY net_feedback ASC;
```

### **Category Breakdown**
```sql
SELECT 
  ft.category,
  COUNT(vf.id) as issue_count
FROM vote_feedback vf
JOIN feedback_tags ft ON ft.id = vf.tag_id
GROUP BY ft.category
ORDER BY issue_count DESC;
```

---

## Testing the System

### **1. Test Tag Selector UI**
```javascript
// In browser console after voting down
// Tag selector should appear automatically
// Try selecting multiple tags
// Try skipping (no tags selected)
```

### **2. Verify Tag Recording**
```sql
-- After submitting tags, check vote_feedback table
SELECT 
  vf.id,
  uv.filter_name,
  ft.tag_label,
  vf.created_at
FROM vote_feedback vf
JOIN user_votes uv ON uv.id = vf.user_vote_id
JOIN feedback_tags ft ON ft.id = vf.tag_id
ORDER BY vf.created_at DESC
LIMIT 10;
```

### **3. Test AI Refinement with Tags**
```javascript
// Vote down 5 times on same style with tags selected
// Check console for refinement trigger
// Should see: "Addressed X specific user-reported issues"
```

---

## Adding New Tags

To add a new feedback tag:

```sql
INSERT INTO feedback_tags (tag_key, tag_label, tag_description, category, sort_order)
VALUES (
  'new_tag_key',
  'Display Label',
  'Description for users',
  'quality', -- or 'style', 'preservation', 'technical'
  99 -- sort order
);
```

**Best Practices:**
- Use snake_case for `tag_key`
- Keep labels short and clear (2-4 words)
- Provide helpful descriptions
- Choose appropriate category
- Set sort_order to control display position

---

## Configuration

### **Tag Cache Duration**
In `feedbackTagService.ts`:
```typescript
const TAG_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
```

### **Feedback Summary Timeframe**
In `update_feedback_summary()` SQL function:
```sql
AND uv.created_at > NOW() - INTERVAL '30 days'
```

### **Top Issues Limit**
In `triggerAutoRefinement()`:
```typescript
const topIssues = await getTopFeedbackIssues(filterId, 10);
```

---

## Troubleshooting

### **Tags not appearing in modal**
1. Check browser console for errors
2. Verify tags seeded: `SELECT COUNT(*) FROM feedback_tags;`
3. Check RLS policies allow public read
4. Clear browser cache and reload

### **Tag selections not saving**
1. Check `vote_feedback` table for records
2. Verify `recordVoteFeedback()` is called
3. Check browser console for errors
4. Verify vote ID is passed correctly

### **AI not using tag feedback**
1. Check `getTopFeedbackIssues()` returns data
2. Verify `feedbackContext` passed to `refinePrompt()`
3. Check console logs during refinement
4. Verify `feedback_summary` column updated

---

## Future Enhancements

Potential improvements:

1. **Custom Tags** - Allow users to write custom feedback
2. **Tag Voting** - Users vote on which tags are most accurate
3. **Multi-Language** - Translate tags to other languages
4. **Tag Suggestions** - AI suggests relevant tags based on image
5. **Heatmaps** - Visual representation of common issues
6. **Tag Trends** - Track how issues change over time
7. **Admin Dashboard** - Manage tags, view analytics

---

## Best Practices

### **DO:**
✅ Review top issues regularly to spot patterns  
✅ Add new tags when users report novel issues  
✅ Update tag descriptions for clarity  
✅ Monitor which tags are never/rarely used  
✅ Use analytics to prioritize improvements  

### **DON'T:**
❌ Delete tags with existing data (set inactive instead)  
❌ Create too many overlapping tags  
❌ Use vague or ambiguous tag labels  
❌ Ignore tags with high usage counts  
❌ Forget to update feedback_summary periodically  

---

## Summary

Your tag-based feedback system provides:

🎯 **Actionable Insights** - Know exactly what users dislike  
🤖 **Smarter AI** - Gemini fixes specific reported issues  
📊 **Rich Analytics** - Track patterns and trends  
💡 **Better UX** - Users feel heard and contribute meaningfully  
🚀 **Faster Improvements** - Data-driven refinements work better  

**The system is production-ready!** Users will now provide detailed feedback that directly improves your prompts.

---

## Database Migration Status

✅ **Tables Created:**
- `feedback_tags` (18 tags seeded)
- `vote_feedback` (ready for user feedback)
- `style_prompts` updated with `feedback_summary` column

✅ **Functions Created:**
- `update_feedback_summary()` - Aggregation function

✅ **Indexes Created:**
- Category, active status, user_vote_id, tag_id, GIN on feedback_summary

✅ **RLS Policies:**
- Public read for active tags
- Public insert/read for vote_feedback

**Everything is operational!** Start collecting detailed user feedback immediately.
