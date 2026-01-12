/**
 * User Prompt Usage Service
 * Tracks how many times each user has used each filter/prompt
 * 
 * Uses buffered analytics to prevent DB exhaustion
 */

import { supabase } from '../utils/supabaseClient';
import { queueAnalyticsEvent } from '../utils/analyticsBuffer';
import { logDbCall, isDebugMode } from '../utils/supabaseDebug';

export interface PromptUsageStats {
  filter_id: string;
  filter_name: string;
  usage_count: number;
  first_used_at: string;
  last_used_at: string;
}

/**
 * Record or increment usage count for a filter
 * Uses buffered writes to prevent DB exhaustion
 * 
 * @param userId - The authenticated user's ID
 * @param filterId - The filter ID (e.g., 'anime', 'vintage')
 * @param filterName - Human-readable filter name
 */
export async function recordPromptUsage(
  userId: string,
  filterId: string,
  filterName: string
): Promise<void> {
  if (isDebugMode()) {
    console.log('📊 Queueing prompt usage:', { userId, filterId, filterName });
  }

  // Queue the event for batched writing instead of immediate DB call
  queueAnalyticsEvent('prompt_usage', 'user_prompt_usage', {
    user_id: userId,
    filter_id: filterId,
    filter_name: filterName,
  });
}

/**
 * Get all prompt usage statistics for a user
 * @param userId - The authenticated user's ID
 * @returns Array of usage statistics sorted by usage count (descending)
 */
export async function getUserPromptUsage(
  userId: string
): Promise<PromptUsageStats[]> {
  try {
    logDbCall('user_prompt_usage', 'select');
    
    const { data, error } = await supabase
      .from('user_prompt_usage')
      .select('filter_id, filter_name, usage_count, first_used_at, last_used_at')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Error fetching user prompt usage:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user prompt usage:', error);
    return [];
  }
}

/**
 * Get total number of prompts used by a user
 * @param userId - The authenticated user's ID
 * @returns Total count of all prompt usages
 */
export async function getTotalPromptUsage(userId: string): Promise<number> {
  try {
    logDbCall('user_prompt_usage', 'select');
    
    const { data, error } = await supabase
      .from('user_prompt_usage')
      .select('usage_count')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching total prompt usage:', error);
      return 0;
    }

    return data?.reduce((sum, item) => sum + item.usage_count, 0) || 0;
  } catch (error) {
    console.error('Error fetching total prompt usage:', error);
    return 0;
  }
}
