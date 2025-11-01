/**
 * Feedback Tag Service
 * Manages detailed user feedback through selectable tags
 */

import { supabase } from '../utils/supabaseClient';

// Check if in development mode
// @ts-ignore - Vite env variable
const IS_DEV_MODE = import.meta.env?.DEV || window.location.hostname === 'localhost';

export interface FeedbackTag {
  id: string;
  tag_key: string;
  tag_label: string;
  tag_description: string | null;
  category: 'quality' | 'style' | 'preservation' | 'technical';
  sort_order: number;
  is_active: boolean;
}

export interface FeedbackSummary {
  [tagKey: string]: number;
}

// In-memory cache for tags
let tagCache: FeedbackTag[] = [];
let tagCacheTime = 0;
const TAG_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch all active feedback tags
 */
export async function getAllFeedbackTags(): Promise<FeedbackTag[]> {
  // Return cache if valid
  if (tagCache.length > 0 && Date.now() - tagCacheTime < TAG_CACHE_DURATION) {
    return tagCache;
  }

  try {
    const { data, error } = await supabase
      .from('feedback_tags')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching feedback tags:', error);
      return [];
    }

    tagCache = data || [];
    tagCacheTime = Date.now();
    return tagCache;
  } catch (err) {
    console.error('Exception fetching feedback tags:', err);
    return [];
  }
}

/**
 * Get tags grouped by category
 */
export async function getTagsByCategory(): Promise<Record<string, FeedbackTag[]>> {
  const tags = await getAllFeedbackTags();
  
  return tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, FeedbackTag[]>);
}

/**
 * Record feedback tags for a vote
 */
export async function recordVoteFeedback(
  userVoteId: string,
  selectedTagIds: string[]
): Promise<boolean> {
  try {
    // In dev mode, simulate feedback recording without database write
    if (IS_DEV_MODE) {
      console.log(`🧪 [DEV MODE] Simulated feedback tags: ${selectedTagIds.length} tags for vote ${userVoteId}`);
      console.log('   Database write skipped in development');
      return true;
    }

    // Insert all selected tags
    const feedbackRecords = selectedTagIds.map(tagId => ({
      user_vote_id: userVoteId,
      tag_id: tagId,
    }));

    const { error } = await supabase
      .from('vote_feedback')
      .insert(feedbackRecords);

    if (error) {
      console.error('Error recording vote feedback:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception recording vote feedback:', err);
    return false;
  }
}

/**
 * Get feedback summary for a filter
 */
export async function getFeedbackSummary(filterId: string): Promise<FeedbackSummary> {
  try {
    const { data, error } = await supabase
      .from('style_prompts')
      .select('feedback_summary')
      .eq('filter_id', filterId)
      .maybeSingle();

    if (error || !data) {
      return {};
    }

    return (data.feedback_summary as FeedbackSummary) || {};
  } catch (err) {
    console.error('Exception getting feedback summary:', err);
    return {};
  }
}

/**
 * Update feedback summary for a filter (call after new feedback)
 */
export async function updateFeedbackSummary(filterId: string): Promise<void> {
  try {
    await supabase.rpc('update_feedback_summary', {
      p_filter_id: filterId,
    });
  } catch (err) {
    console.error('Error updating feedback summary:', err);
  }
}

/**
 * Get top feedback issues for a filter
 */
export async function getTopFeedbackIssues(
  filterId: string,
  limit: number = 5
): Promise<Array<{ tag: FeedbackTag; count: number }>> {
  try {
    const summary = await getFeedbackSummary(filterId);
    const tags = await getAllFeedbackTags();
    
    // Convert summary to array and sort by count
    const tagCounts = Object.entries(summary)
      .map(([tagKey, count]) => {
        const tag = tags.find(t => t.tag_key === tagKey);
        return tag ? { tag, count } : null;
      })
      .filter((item): item is { tag: FeedbackTag; count: number } => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return tagCounts;
  } catch (err) {
    console.error('Exception getting top feedback issues:', err);
    return [];
  }
}

/**
 * Get detailed feedback stats for analytics
 */
export async function getFeedbackStats(filterId: string): Promise<{
  totalFeedbackVotes: number;
  tagBreakdown: Array<{ tag: FeedbackTag; count: number; percentage: number }>;
  categoryBreakdown: Record<string, number>;
}> {
  try {
    // Get all downvotes with feedback
    const { data: votes, error } = await supabase
      .from('user_votes')
      .select(`
        id,
        vote_feedback (
          tag_id,
          feedback_tags (*)
        )
      `)
      .eq('filter_name', filterId)
      .eq('vote_type', 'down');

    if (error || !votes) {
      return {
        totalFeedbackVotes: 0,
        tagBreakdown: [],
        categoryBreakdown: {},
      };
    }

    const totalFeedbackVotes = votes.filter(v => 
      Array.isArray(v.vote_feedback) && v.vote_feedback.length > 0
    ).length;

    // Count tags
    const tagCounts = new Map<string, { tag: FeedbackTag; count: number }>();
    const categoryCounts: Record<string, number> = {};

    votes.forEach(vote => {
      if (Array.isArray(vote.vote_feedback)) {
        vote.vote_feedback.forEach((vf: any) => {
          if (vf.feedback_tags) {
            const tag = vf.feedback_tags as FeedbackTag;
            const current = tagCounts.get(tag.tag_key);
            
            if (current) {
              current.count++;
            } else {
              tagCounts.set(tag.tag_key, { tag, count: 1 });
            }

            categoryCounts[tag.category] = (categoryCounts[tag.category] || 0) + 1;
          }
        });
      }
    });

    const tagBreakdown = Array.from(tagCounts.values())
      .map(item => ({
        ...item,
        percentage: totalFeedbackVotes > 0 ? (item.count / totalFeedbackVotes) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalFeedbackVotes,
      tagBreakdown,
      categoryBreakdown: categoryCounts,
    };
  } catch (err) {
    console.error('Exception getting feedback stats:', err);
    return {
      totalFeedbackVotes: 0,
      tagBreakdown: [],
      categoryBreakdown: {},
    };
  }
}
