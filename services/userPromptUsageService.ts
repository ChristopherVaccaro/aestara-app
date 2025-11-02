/**
 * User Prompt Usage Service
 * Tracks how many times each user has used each filter/prompt
 */

import { supabase } from '../utils/supabaseClient';

export interface PromptUsageStats {
  filter_id: string;
  filter_name: string;
  usage_count: number;
  first_used_at: string;
  last_used_at: string;
}

/**
 * Record or increment usage count for a filter
 * @param userId - The authenticated user's ID
 * @param filterId - The filter ID (e.g., 'anime', 'vintage')
 * @param filterName - Human-readable filter name
 */
export async function recordPromptUsage(
  userId: string,
  filterId: string,
  filterName: string
): Promise<void> {
  try {
    // Try to get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('user_prompt_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('filter_id', filterId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for first use
      console.error('Error fetching prompt usage:', fetchError);
      return;
    }

    if (existing) {
      // Increment existing record
      const { error: updateError } = await supabase
        .from('user_prompt_usage')
        .update({
          usage_count: existing.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('filter_id', filterId);

      if (updateError) {
        console.error('Error updating prompt usage:', updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_prompt_usage')
        .insert({
          user_id: userId,
          filter_id: filterId,
          filter_name: filterName,
          usage_count: 1,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting prompt usage:', insertError);
      }
    }
  } catch (error) {
    console.error('Error recording prompt usage:', error);
  }
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
