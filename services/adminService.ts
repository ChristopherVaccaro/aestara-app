import { supabase } from '../utils/supabaseClient';

// Admin email - set this in your .env file as VITE_ADMIN_EMAIL
// @ts-ignore - Vite env variables
const ADMIN_EMAIL = import.meta.env?.VITE_ADMIN_EMAIL || 'your-email@example.com';

export const isAdmin = (userEmail: string | undefined): boolean => {
  if (!userEmail) return false;
  return userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export interface StyleAnalytics {
  filter_id: string;
  filter_name: string;
  total_votes: number;
  thumbs_up: number;
  thumbs_down: number;
  net_feedback: number;
  approval_rate: number;
  generation_count: number;
  prompt_version: number;
  last_updated: string;
  top_issues: Array<{
    tag_name: string;
    count: number;
    category: string;
  }>;
  needs_attention: boolean;
}

export const getStyleAnalytics = async (): Promise<StyleAnalytics[]> => {
  try {
    // Get all style prompts with vote statistics
    const { data: prompts, error: promptError } = await supabase
      .from('style_prompts')
      .select('*')
      .order('filter_name');

    if (promptError) throw promptError;

    // Get vote counts for each style
    const analytics: StyleAnalytics[] = [];

    for (const prompt of prompts || []) {
      // Get vote statistics (include id for tag aggregation)
      const { data: votes, error: voteError } = await supabase
        .from('user_votes')
        .select('id, vote_type')
        .eq('filter_name', prompt.filter_name);

      if (voteError) {
        console.error(`Error fetching votes for ${prompt.filter_name}:`, voteError);
        continue;
      }

      const thumbsUp = votes?.filter(v => v.vote_type === 'up').length || 0;
      const thumbsDown = votes?.filter(v => v.vote_type === 'down').length || 0;
      const totalVotes = thumbsUp + thumbsDown;
      const approvalRate = totalVotes > 0 ? (thumbsUp / totalVotes) * 100 : 0;

      // Get top feedback issues (join via user_vote_id)
      let topIssues: Array<{ tag_name: string; count: number; category: string }> = [];
      if (votes && votes.length > 0) {
        const voteIds = (votes as any[]).map(v => v.id);

        const { data: feedbackData, error: feedbackError } = await supabase
          .from('vote_feedback')
          .select(`
            feedback_tags (
              tag_name,
              category
            )
          `)
          .in('user_vote_id', voteIds);

        if (!feedbackError && feedbackData) {
          const tagCounts = new Map<string, { count: number; category: string }>();
          feedbackData.forEach((item: any) => {
            if (item.feedback_tags) {
              const tag = item.feedback_tags.tag_name;
              const category = item.feedback_tags.category;
              const current = tagCounts.get(tag) || { count: 0, category };
              tagCounts.set(tag, { count: current.count + 1, category });
            }
          });

          topIssues = Array.from(tagCounts.entries())
            .map(([tag_name, { count, category }]) => ({ tag_name, count, category }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }
      }

      // Determine if style needs attention
      const needsAttention = 
        (totalVotes >= 10 && approvalRate < 40) || // Low approval rate
        (prompt.net_feedback <= -5) || // Very negative feedback
        (thumbsDown >= 10 && approvalRate < 50); // Many downvotes

      analytics.push({
        filter_id: prompt.filter_id,
        filter_name: prompt.filter_name,
        total_votes: totalVotes,
        thumbs_up: thumbsUp,
        thumbs_down: thumbsDown,
        net_feedback: prompt.net_feedback,
        approval_rate: approvalRate,
        generation_count: prompt.generation_count || 0,
        prompt_version: prompt.prompt_version,
        last_updated: prompt.updated_at,
        top_issues: topIssues,
        needs_attention: needsAttention,
      });
    }

    // Sort by needs attention first, then by approval rate
    return analytics.sort((a, b) => {
      if (a.needs_attention && !b.needs_attention) return -1;
      if (!a.needs_attention && b.needs_attention) return 1;
      return a.approval_rate - b.approval_rate;
    });
  } catch (error) {
    console.error('Error fetching style analytics:', error);
    throw error;
  }
};

export const getOverallStats = async () => {
  try {
    const analytics = await getStyleAnalytics();
    
    const totalStyles = analytics.length;
    const stylesNeedingAttention = analytics.filter(s => s.needs_attention).length;
    const totalVotes = analytics.reduce((sum, s) => sum + s.total_votes, 0);
    const totalGenerations = analytics.reduce((sum, s) => sum + s.generation_count, 0);
    const avgApprovalRate = analytics.length > 0
      ? analytics.reduce((sum, s) => sum + s.approval_rate, 0) / analytics.length
      : 0;

    return {
      totalStyles,
      stylesNeedingAttention,
      totalVotes,
      totalGenerations,
      avgApprovalRate,
      healthyStyles: totalStyles - stylesNeedingAttention,
    };
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    throw error;
  }
};
