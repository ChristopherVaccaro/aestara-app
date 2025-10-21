# Admin Dashboard Guide

## Quick Access
```
http://localhost:5173/?page=admin&dev=true
```

## Understanding the Columns

### 1. **Style**
- The name of the art style filter
- Version number (v1, v2, etc.) shows how many times the prompt has been refined
- Higher version = more refinements due to poor performance

### 2. **Votes** 
- **Total votes**: How many users have voted (👍 or 👎)
- **Breakdown**: Shows thumbs up vs thumbs down counts
- **Why 0%?**: No votes yet - users need to generate images and vote on them

### 3. **Approval Rate**
- Percentage of positive votes: `(thumbs up / total votes) × 100`
- Visual progress bar:
  - 🟢 Green (≥60%): Healthy style
  - 🟡 Yellow (40-60%): Monitor closely
  - 🔴 Red (<40%): Needs attention
- **Example**: 8 thumbs up, 2 thumbs down = 80% approval

### 4. **Net Score**
- Simple calculation: `thumbs up - thumbs down`
- Positive number = more likes than dislikes
- Negative number = more dislikes than likes
- **Triggers auto-refinement at -5 or lower**

### 5. **Times Used** (formerly "Generations")
- How many times users have applied this style
- Counts every time someone clicks the style button
- High usage + low approval = urgent problem
- Low usage = style might not be discoverable or appealing

### 6. **Top Issues**
- Most reported feedback tags from users
- Shows up to 3 most common problems
- Categories:
  - **Quality**: Blurry, Low Quality, Artifacts
  - **Style**: Wrong Style, Inconsistent, Over-Stylized
  - **Preservation**: Lost Facial Features, Changed Expression
  - **Technical**: Safety Filter, Incomplete, Composition Changed
- Helps you understand WHY users dislike a style

### 7. **Status**
- **🟢 Healthy**: Approval ≥60%, no action needed
- **🟡 Monitor**: Approval 40-60%, watch for trends
- **🔴 Needs Attention**: One of these conditions:
  - 10+ votes with approval <40%
  - Net feedback ≤ -5
  - 10+ downvotes with approval <50%

## Sorting Features

Click any column header to sort:
- **First click**: Sort descending (high to low)
- **Second click**: Sort ascending (low to high)
- **Active column**: Shows blue arrow (↑ or ↓)
- **Inactive columns**: Show gray double arrow (⇅)

### Recommended Sorts

**Find problem styles:**
- Sort by **Status** (default) - shows "Needs Attention" first
- Sort by **Approval** (ascending) - lowest approval first
- Sort by **Net Score** (ascending) - most negative first

**Find popular styles:**
- Sort by **Times Used** (descending) - most used first
- Sort by **Votes** (descending) - most voted first

**Alphabetical:**
- Sort by **Style** - A to Z

## Sticky Headers

- Headers stay visible as you scroll down
- Table scrolls independently
- Max height: Fits within viewport
- No need to scroll back up to see column names

## How to Get Data

The dashboard shows **0% approval** because no votes exist yet. To populate data:

### 1. Generate Images
- Go to main app: `http://localhost:5173/`
- Upload an image
- Apply different styles

### 2. Vote on Results
- After each generation, vote 👍 or 👎
- Optionally select feedback tags (what's wrong)
- Each vote is recorded in the database

### 3. Refresh Dashboard
- Click **Refresh** button in top-right
- Or reload the page
- Data updates in real-time from database

## Auto-Refinement System

When a style reaches **net feedback ≤ -5**:
1. System automatically triggers AI refinement
2. Gemini analyzes the prompt + feedback tags
3. Generates improved prompt
4. Saves new version to database
5. Net feedback resets to 0
6. Version number increments (v1 → v2)

## Tips for Monitoring

### Daily Checks
- Look for red "Needs Attention" badges
- Review styles with high usage but low approval
- Check if auto-refinement is working (version numbers increasing)

### Weekly Analysis
- Compare approval rates across categories
- Identify patterns in top issues
- Remove or replace consistently poor styles

### Before Deployment
- Ensure no styles have <40% approval with 10+ votes
- Test any styles with version 3+ (multiple refinements)
- Review styles with 0 usage (might need better naming/positioning)

## Troubleshooting

**All approval rates are 0%**
- No votes have been cast yet
- Generate images and vote on them

**Times Used is 0 for all styles**
- No images have been generated yet
- Or database isn't tracking generations properly

**Top Issues column is empty**
- Users haven't selected feedback tags when voting
- Or only thumbs up votes (no issues to report)

**Status shows "Needs Attention" but approval is 0%**
- Not possible - needs 10+ votes to trigger
- Refresh the page

## Production Monitoring

Once deployed, check dashboard regularly:
- **Daily**: Look for new "Needs Attention" flags
- **Weekly**: Review approval trends
- **Monthly**: Analyze which styles are most/least used
- **After updates**: Verify prompt refinements improved approval

## Future Enhancements

Potential additions:
- Export data to CSV
- Historical trend charts
- Filter by category
- Search styles by name
- Manual prompt editing
- Bulk operations
- Vote timeline visualization
- User engagement metrics
