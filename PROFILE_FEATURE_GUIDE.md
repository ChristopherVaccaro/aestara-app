# Profile Feature Guide

## Overview
The profile feature allows authenticated users to view their prompt usage statistics and see a visual indicator (avatar) when logged in.

## Features Implemented

### 1. User Avatar with Initials
- **Component**: `UserAvatar.tsx`
- **Location**: Displayed in the header (top-right) when user is logged in
- **Functionality**:
  - Shows user's initials derived from email address
  - Consistent color based on email (same user always gets same color)
  - Responsive sizing (sm, md, lg)
  - Examples:
    - `john.doe@gmail.com` → **JD**
    - `alice@example.com` → **A**
    - `bob.smith.jones@company.com` → **BJ**

### 2. Profile Menu Item
- **Location**: Hamburger menu (only visible when logged in)
- **Icon**: User icon
- **Action**: Opens profile page modal

### 3. Profile Page
- **Component**: `ProfilePage.tsx`
- **Features**:
  - User information display (email, member since date)
  - Statistics summary cards:
    - **Total Generations**: Total number of times user has generated images
    - **Styles Used**: Number of unique styles/filters used
    - **Most Used**: The style used most frequently
  - Usage history table showing:
    - Style name
    - Times used (count badge)
    - First used date
    - Last used date
  - Sorted by usage count (most used first)

### 4. Prompt Usage Tracking
- **Service**: `userPromptUsageService.ts`
- **Database Table**: `user_prompt_usage`
- **Tracking**:
  - Automatically records when authenticated users apply filters
  - Increments usage count for each filter
  - Tracks first and last usage timestamps
  - Only tracks for logged-in users (anonymous users not tracked)

## Database Schema

### Table: `user_prompt_usage`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- filter_id: TEXT (e.g., 'anime', 'vintage')
- filter_name: TEXT (human-readable name)
- usage_count: INTEGER (number of times used)
- first_used_at: TIMESTAMPTZ
- last_used_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Indexes
- `idx_user_prompt_usage_user_id` - Fast lookups by user
- `idx_user_prompt_usage_filter_id` - Fast lookups by filter
- `idx_user_prompt_usage_user_filter` - Unique constraint (user_id, filter_id)

### Row Level Security (RLS)
- Users can only read their own usage data
- Users can only insert/update their own usage data
- Policies enforce `auth.uid() = user_id`

## Setup Instructions

### 1. Run Database Migration
Execute the SQL migration file in your Supabase project:
```bash
# File: SUPABASE_MIGRATION_USER_PROMPT_USAGE.sql
```

Run this in Supabase SQL Editor or via CLI:
```bash
supabase db push
```

### 2. Verify Tables
Check that the `user_prompt_usage` table exists:
```sql
SELECT * FROM user_prompt_usage LIMIT 1;
```

### 3. Test Authentication
Ensure Google OAuth is properly configured (see `GOOGLE_AUTH_SETUP.md`)

## User Flow

### Viewing Profile
1. User signs in with Google
2. User avatar appears in header (top-right)
3. User opens hamburger menu
4. User clicks "Profile" menu item
5. Profile modal opens showing usage statistics

### Usage Tracking
1. User signs in with Google
2. User uploads an image
3. User applies a filter (e.g., "Anime")
4. System automatically records usage:
   - First time: Creates new record with `usage_count = 1`
   - Subsequent times: Increments `usage_count` and updates `last_used_at`
5. User can view statistics in profile page

## API Functions

### `recordPromptUsage(userId, filterId, filterName)`
Records or increments usage count for a filter.
- **Parameters**:
  - `userId`: Authenticated user's ID
  - `filterId`: Filter ID (e.g., 'anime')
  - `filterName`: Human-readable name (e.g., 'Anime')
- **Behavior**:
  - Creates new record if first use
  - Increments count if already used
  - Updates `last_used_at` timestamp

### `getUserPromptUsage(userId)`
Retrieves all usage statistics for a user.
- **Returns**: Array of `PromptUsageStats` sorted by usage count (descending)

### `getTotalPromptUsage(userId)`
Gets total number of generations across all filters.
- **Returns**: Number (sum of all usage counts)

## UI Components

### UserAvatar
```tsx
<UserAvatar 
  email="user@example.com" 
  size="md" 
  onClick={() => console.log('Avatar clicked')}
/>
```

### ProfilePage
```tsx
<ProfilePage onClose={() => setShowProfile(false)} />
```

## Styling

### Avatar Colors
8 distinct colors assigned based on email hash:
- Blue (`bg-blue-500`)
- Purple (`bg-purple-500`)
- Pink (`bg-pink-500`)
- Indigo (`bg-indigo-500`)
- Cyan (`bg-cyan-500`)
- Teal (`bg-teal-500`)
- Green (`bg-green-500`)
- Orange (`bg-orange-500`)

### Profile Page Design
- Dark theme with glass morphism
- Gradient stat cards (blue/purple/pink)
- Responsive table layout
- Smooth animations and transitions

## Privacy & Security

### Data Access
- Users can only see their own usage data
- RLS policies enforce user isolation
- No cross-user data leakage

### Anonymous Users
- Anonymous users (not logged in) are NOT tracked
- Only authenticated users have usage statistics
- No browser fingerprinting for profile feature

### Data Retention
- Usage data persists as long as user account exists
- Deleting user account cascades to usage data (ON DELETE CASCADE)

## Future Enhancements

Potential improvements:
1. **Export Data**: Allow users to export their usage statistics as CSV
2. **Charts**: Add visual charts showing usage trends over time
3. **Achievements**: Gamification with badges for milestones
4. **Favorites**: Let users mark favorite styles
5. **Usage Insights**: Show peak usage times, most popular styles
6. **Comparison**: Compare usage with community averages

## Troubleshooting

### Profile Page Shows "No usage data yet"
- Ensure user is signed in
- Ensure user has generated at least one image
- Check database for records: `SELECT * FROM user_prompt_usage WHERE user_id = 'USER_ID'`

### Avatar Not Showing
- Verify user is authenticated: `user` object should exist
- Check console for errors
- Ensure `useAuth()` hook is working

### Usage Count Not Incrementing
- Check browser console for errors
- Verify RLS policies are correct
- Ensure `recordPromptUsage()` is being called in `handleApplyFilter()`
- Check Supabase logs for permission errors

## Files Created/Modified

### New Files
- `components/UserAvatar.tsx` - Avatar component
- `components/ProfilePage.tsx` - Profile modal
- `services/userPromptUsageService.ts` - Usage tracking service
- `SUPABASE_MIGRATION_USER_PROMPT_USAGE.sql` - Database migration
- `PROFILE_FEATURE_GUIDE.md` - This documentation

### Modified Files
- `components/HamburgerMenu.tsx` - Added profile menu item
- `components/Header.tsx` - Added avatar display
- `App.tsx` - Added usage tracking on filter apply

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] User can sign in with Google
- [ ] Avatar appears in header when logged in
- [ ] Avatar shows correct initials
- [ ] Profile menu item appears in hamburger menu
- [ ] Profile page opens when clicked
- [ ] Profile shows user email and member date
- [ ] Stats cards show correct numbers
- [ ] Usage table displays all used filters
- [ ] Usage count increments when filter applied
- [ ] First/last used dates are accurate
- [ ] Table sorts by usage count (descending)
- [ ] Anonymous users don't see profile menu item
- [ ] RLS policies prevent cross-user access

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify authentication is working
3. Check browser console for JavaScript errors
4. Review RLS policies in Supabase dashboard
