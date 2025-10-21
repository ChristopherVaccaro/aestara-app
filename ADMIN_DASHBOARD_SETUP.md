# Admin Dashboard Setup Guide

## Overview
The admin dashboard provides real-time analytics on style performance, helping you identify which styles are working well and which need attention.

## Features

### Dashboard Metrics
- **Total Styles**: Number of styles in the system
- **Needs Attention**: Styles with low approval rates or negative feedback
- **Total Votes**: All votes across all styles
- **Average Approval Rate**: Overall system health metric

### Style Analytics Table
For each style, you can see:
- **Vote Statistics**: Total votes, thumbs up/down breakdown
- **Approval Rate**: Visual progress bar and percentage
- **Net Score**: Net feedback score (thumbs up - thumbs down)
- **Generation Count**: How many times the style has been used
- **Top Issues**: Most reported feedback tags
- **Status**: Healthy, Monitor, or Needs Attention

### Attention Triggers
A style is flagged as "Needs Attention" when:
- 10+ votes with approval rate < 40%
- Net feedback ≤ -5
- 10+ downvotes with approval rate < 50%

## Setup Instructions

### 1. Set Your Admin Email

Create or update your `.env` file in the project root:

```env
VITE_ADMIN_EMAIL=your-email@gmail.com
```

Replace `your-email@gmail.com` with the email you use to sign in with Google OAuth.

### 2. Access the Dashboard

**Option 1: Direct URL**
Navigate to: `http://localhost:5173/?page=admin`

**Option 2: Bookmark**
Create a bookmark for quick access to the admin dashboard.

### 3. Authentication

1. You must be signed in with Google OAuth
2. Your email must match the `VITE_ADMIN_EMAIL` environment variable
3. If not authenticated or not admin, you'll see an access denied message

## Using the Dashboard

### Monitoring Style Performance

**Healthy Styles** (Green badge)
- Approval rate ≥ 60%
- No immediate action needed
- Continue monitoring

**Monitor Styles** (Yellow badge)
- Approval rate between 40-60%
- Watch for trends
- Consider testing improvements

**Needs Attention** (Red badge)
- Approval rate < 40% OR net feedback ≤ -5
- Review top issues immediately
- Prompt refinement recommended

### Understanding Top Issues

The dashboard shows the most reported feedback tags for each style:
- **Quality Issues**: Too Blurry, Low Quality, Visual Artifacts, etc.
- **Style Issues**: Wrong Style, Inconsistent Style, Over-Stylized, etc.
- **Preservation Issues**: Lost Facial Features, Changed Expression, etc.
- **Technical Issues**: Safety Filter, Incomplete, Composition Changed, etc.

### Taking Action

When a style needs attention:

1. **Review Top Issues**: Identify the most common problems
2. **Check Net Feedback**: Understand overall sentiment
3. **Monitor Generation Count**: High usage + low approval = urgent fix
4. **Wait for Auto-Refinement**: System auto-refines at net_feedback ≤ -5
5. **Manual Override**: Update prompt in database if needed

### Refresh Data

Click the **Refresh** button in the top-right to reload all analytics data.

## Security Notes

- Admin access is restricted to the email in `VITE_ADMIN_EMAIL`
- No database changes can be made from the dashboard (read-only)
- Dashboard requires Google OAuth authentication
- Environment variables are not exposed to users

## Production Deployment

### Netlify/Vercel

Add the environment variable in your hosting platform:
1. Go to Site Settings → Environment Variables
2. Add `VITE_ADMIN_EMAIL` with your admin email
3. Redeploy the site

### Access in Production

Navigate to: `https://your-domain.com/?page=admin`

## Troubleshooting

**"Access Denied" message**
- Verify you're signed in with Google
- Check that your email matches `VITE_ADMIN_EMAIL`
- Ensure environment variable is set correctly
- Try signing out and back in

**"Failed to load analytics data"**
- Check browser console for errors
- Verify Supabase connection is working
- Ensure database tables exist (style_prompts, user_votes, etc.)
- Click Refresh to retry

**No data showing**
- Ensure users have voted on styles
- Check that prompts are seeded in database
- Verify vote tracking is working in main app

## Database Queries

The dashboard runs these queries:
- `style_prompts` - Gets all styles and their metadata
- `user_votes` - Counts votes per style
- `vote_feedback` - Aggregates feedback tags

All queries are read-only and don't modify data.

## Future Enhancements

Potential additions:
- Manual prompt editing interface
- Bulk prompt refinement trigger
- Historical trend charts
- Export analytics to CSV
- Filter by category
- Search/filter styles
- Vote timeline visualization
