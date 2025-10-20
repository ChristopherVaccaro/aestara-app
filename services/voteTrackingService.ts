/**
 * Vote Tracking Service
 * Tracks user feedback (thumbs up/down) for each art style generation
 * Uses Supabase for global voting system across all users
 * Automatically triggers prompt refinement when negative threshold is exceeded
 * Supports both authenticated users (via user_id) and anonymous users (via browser_id)
 */

import { supabase } from '../utils/supabaseClient';
import { getBrowserId } from '../utils/browserFingerprint';

/**
 * Get user identifier - uses authenticated user ID if available, otherwise browser fingerprint
 */
export async function getUserIdentifier(): Promise<{ userId: string | null; browserId: string }> {
  const browserId = getBrowserId();
  const { data: { user } } = await supabase.auth.getUser();
  return {
    userId: user?.id || null,
    browserId,
  };
}

export interface StyleVotes {
  thumbsUp: number;
  thumbsDown: number;
  totalVotes: number;
  lastModified: string;
}

export interface VoteData {
  [filterName: string]: StyleVotes;
}

export interface PromptOverride {
  originalPrompt: string;
  refinedPrompt: string;
  timestamp: string;
  reason: string;
}

export interface PromptOverrides {
  [filterName: string]: PromptOverride;
}

// Threshold configuration
// Use lower threshold for testing (localhost), higher for production
const IS_DEVELOPMENT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const VOTE_THRESHOLD = IS_DEVELOPMENT ? 5 : 20; // Minimum votes before considering changes
export const NEGATIVE_RATIO_THRESHOLD = 0.6; // 60% thumbs down triggers refinement

/**
 * Load vote data from Supabase
 */
export async function loadVoteData(): Promise<VoteData> {
  try {
    const { data, error } = await supabase
      .from('style_votes')
      .select('*')
      .order('last_modified', { ascending: false }); // Force fresh data
    
    if (error) throw error;
    
    const voteData: VoteData = {};
    data?.forEach(row => {
      voteData[row.filter_name] = {
        thumbsUp: row.thumbs_up,
        thumbsDown: row.thumbs_down,
        totalVotes: row.total_votes,
        lastModified: row.last_modified,
      };
    });
    
    return voteData;
  } catch (error) {
    console.error('Error loading vote data:', error);
    return {};
  }
}

/**
 * Load prompt overrides from Supabase
 */
export async function loadPromptOverrides(): Promise<PromptOverrides> {
  try {
    const { data, error } = await supabase
      .from('prompt_overrides')
      .select('*')
      .order('updated_at', { ascending: false }); // Force fresh data
    
    if (error) throw error;
    
    const overrides: PromptOverrides = {};
    data?.forEach(row => {
      overrides[row.filter_name] = {
        originalPrompt: row.original_prompt,
        refinedPrompt: row.refined_prompt,
        timestamp: row.created_at,
        reason: row.reason,
      };
    });
    
    return overrides;
  } catch (error) {
    console.error('Error loading prompt overrides:', error);
    return {};
  }
}

/**
 * Check if user has voted for this filter within the last 2 hours
 * Returns the vote record if found and still within time window, null otherwise
 */
export async function getRecentVote(filterName: string): Promise<{ id: string; vote_type: string; created_at: string } | null> {
  try {
    const { userId, browserId } = await getUserIdentifier();
    
    let query = supabase
      .from('user_votes')
      .select('id, vote_type, created_at')
      .eq('filter_name', filterName)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Check by user_id if authenticated, otherwise by browser_id
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('browser_id', browserId);
    }
    
    const { data } = await query.single();
    
    if (!data) return null;
    
    // Check if vote is within 2 hour window
    const voteTime = new Date(data.created_at).getTime();
    const now = Date.now();
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    
    if (now - voteTime < twoHoursInMs) {
      return data;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has already voted for this filter (within 2 hour window)
 */
export async function hasUserVoted(filterName: string): Promise<boolean> {
  const recentVote = await getRecentVote(filterName);
  return !!recentVote;
}

/**
 * Record a vote for a specific filter
 * If user voted within 2 hours, prevents duplicate vote
 * If user voted more than 2 hours ago, updates their vote
 */
export async function recordVote(filterName: string, isPositive: boolean): Promise<boolean> {
  try {
    const { userId, browserId } = await getUserIdentifier();
    
    // Check if user has a recent vote (within 2 hours)
    const recentVote = await getRecentVote(filterName);
    
    if (recentVote) {
      console.log('User has already voted for this filter within the last 2 hours');
      return false;
    }
    
    // Check if user has an old vote (more than 2 hours ago)
    let query = supabase
      .from('user_votes')
      .select('id, vote_type')
      .eq('filter_name', filterName)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('browser_id', browserId);
    }
    
    const { data: oldVote } = await query.single();
    
    const newVoteType = isPositive ? 'up' : 'down';
    
    if (oldVote) {
      // User has an old vote - update it and adjust global counts
      const oldVoteType = oldVote.vote_type;
      
      // Update the user's vote record
      const { error: updateError } = await supabase
        .from('user_votes')
        .update({
          vote_type: newVoteType,
          created_at: new Date().toISOString(),
        })
        .eq('id', oldVote.id);
      
      if (updateError) throw updateError;
      
      // Adjust global vote counts
      const { data: existingVote } = await supabase
        .from('style_votes')
        .select('*')
        .eq('filter_name', filterName)
        .order('last_modified', { ascending: false })
        .limit(1)
        .single();
      
      if (existingVote) {
        let newThumbsUp = existingVote.thumbs_up;
        let newThumbsDown = existingVote.thumbs_down;
        
        // Remove old vote
        if (oldVoteType === 'up') {
          newThumbsUp = Math.max(0, newThumbsUp - 1);
        } else {
          newThumbsDown = Math.max(0, newThumbsDown - 1);
        }
        
        // Add new vote
        if (newVoteType === 'up') {
          newThumbsUp += 1;
        } else {
          newThumbsDown += 1;
        }
        
        const { error: updateVoteError } = await supabase
          .from('style_votes')
          .update({
            thumbs_up: newThumbsUp,
            thumbs_down: newThumbsDown,
            last_modified: new Date().toISOString(),
          })
          .eq('filter_name', filterName);
        
        if (updateVoteError) throw updateVoteError;
      }
    } else {
      // User has never voted - create new vote
      const { error: userVoteError } = await supabase
        .from('user_votes')
        .insert({
          user_id: userId,
          browser_id: browserId,
          filter_name: filterName,
          vote_type: newVoteType,
        });
      
      if (userVoteError) throw userVoteError;
      
      // Update the global vote count
      const { data: existingVote } = await supabase
        .from('style_votes')
        .select('*')
        .eq('filter_name', filterName)
        .order('last_modified', { ascending: false })
        .limit(1)
        .single();
      
      if (existingVote) {
        // Update existing vote count
        const { error: updateError } = await supabase
          .from('style_votes')
          .update({
            thumbs_up: newVoteType === 'up' ? existingVote.thumbs_up + 1 : existingVote.thumbs_up,
            thumbs_down: newVoteType === 'down' ? existingVote.thumbs_down + 1 : existingVote.thumbs_down,
            total_votes: existingVote.total_votes + 1,
            last_modified: new Date().toISOString(),
          })
          .eq('filter_name', filterName);
        
        if (updateError) throw updateError;
      } else {
        // Create new vote record
        const { error: insertError } = await supabase
          .from('style_votes')
          .insert({
            filter_name: filterName,
            thumbs_up: newVoteType === 'up' ? 1 : 0,
            thumbs_down: newVoteType === 'down' ? 1 : 0,
            total_votes: 1,
          });
        
        if (insertError) throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error recording vote:', error);
    return false;
  }
}

/**
 * Check if a filter needs prompt refinement based on vote threshold
 */
export async function needsRefinement(filterName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('style_votes')
      .select('*')
      .eq('filter_name', filterName)
      .order('last_modified', { ascending: false }) // Force fresh data
      .limit(1)
      .single();
    
    if (error || !data) return false;
    
    if (data.total_votes < VOTE_THRESHOLD) {
      return false;
    }
    
    const negativeRatio = data.thumbs_down / data.total_votes;
    return negativeRatio >= NEGATIVE_RATIO_THRESHOLD;
  } catch (error) {
    console.error('Error checking refinement need:', error);
    return false;
  }
}

/**
 * Get vote statistics for a filter
 */
export async function getVoteStats(filterName: string): Promise<StyleVotes | null> {
  try {
    const { data, error } = await supabase
      .from('style_votes')
      .select('*')
      .eq('filter_name', filterName)
      .order('last_modified', { ascending: false }) // Force fresh data
      .limit(1)
      .single();
    
    if (error || !data) return null;
    
    return {
      thumbsUp: data.thumbs_up,
      thumbsDown: data.thumbs_down,
      totalVotes: data.total_votes,
      lastModified: data.last_modified,
    };
  } catch (error) {
    console.error('Error getting vote stats:', error);
    return null;
  }
}

/**
 * Save a refined prompt for a filter
 */
export async function savePromptOverride(
  filterName: string,
  originalPrompt: string,
  refinedPrompt: string,
  reason: string
): Promise<void> {
  try {
    // Check if override already exists
    const { data: existing } = await supabase
      .from('prompt_overrides')
      .select('id')
      .eq('filter_name', filterName)
      .order('updated_at', { ascending: false }) // Force fresh data
      .limit(1)
      .single();
    
    if (existing) {
      // Update existing override
      const { error } = await supabase
        .from('prompt_overrides')
        .update({
          original_prompt: originalPrompt,
          refined_prompt: refinedPrompt,
          reason,
          updated_at: new Date().toISOString(),
        })
        .eq('filter_name', filterName);
      
      if (error) throw error;
    } else {
      // Insert new override
      const { error } = await supabase
        .from('prompt_overrides')
        .insert({
          filter_name: filterName,
          original_prompt: originalPrompt,
          refined_prompt: refinedPrompt,
          reason,
        });
      
      if (error) throw error;
    }
    
    // Reset vote counts after refinement
    await resetVotes(filterName);
  } catch (error) {
    console.error('Error saving prompt override:', error);
  }
}

/**
 * Get the active prompt for a filter (override if exists, otherwise original)
 */
export async function getActivePrompt(filterName: string, originalPrompt: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('prompt_overrides')
      .select('refined_prompt')
      .eq('filter_name', filterName)
      .order('updated_at', { ascending: false }) // Force fresh data
      .limit(1)
      .single();
    
    if (error || !data) return originalPrompt;
    
    return data.refined_prompt;
  } catch (error) {
    console.error('Error getting active prompt:', error);
    return originalPrompt;
  }
}

/**
 * Reset votes for a filter (called after refinement)
 */
export async function resetVotes(filterName: string): Promise<void> {
  try {
    // Delete all user votes for this filter
    await supabase
      .from('user_votes')
      .delete()
      .eq('filter_name', filterName);
    
    // Reset the global vote count
    const { error } = await supabase
      .from('style_votes')
      .update({
        thumbs_up: 0,
        thumbs_down: 0,
        total_votes: 0,
        last_modified: new Date().toISOString(),
      })
      .eq('filter_name', filterName);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error resetting votes:', error);
  }
}

/**
 * Get all vote data (for admin/debugging)
 */
export async function getAllVoteData(): Promise<{ votes: VoteData; overrides: PromptOverrides }> {
  const votes = await loadVoteData();
  const overrides = await loadPromptOverrides();
  return { votes, overrides };
}

/**
 * Clear all vote data (for testing/reset)
 */
export async function clearAllVoteData(): Promise<void> {
  try {
    await supabase.from('user_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('style_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('prompt_overrides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('All vote data cleared');
  } catch (error) {
    console.error('Error clearing vote data:', error);
  }
}
