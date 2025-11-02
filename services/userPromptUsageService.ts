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
    console.log('📊 Recording prompt usage:', { userId, filterId, filterName });

    // Try to get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('user_prompt_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('filter_id', filterId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error on no results

    if (fetchError) {
      console.error('❌ Error fetching prompt usage:', fetchError);
      return;
    }

    const now = new Date().toISOString();

    if (existing) {
      // Increment existing record
      console.log(`✅ Found existing record, incrementing from ${existing.usage_count} to ${existing.usage_count + 1}`);
      
      const { error: updateError } = await supabase
        .from('user_prompt_usage')
        .update({
          usage_count: existing.usage_count + 1,
          last_used_at: now,
        })
        .eq('user_id', userId)
        .eq('filter_id', filterId);

      if (updateError) {
        console.error('❌ Error updating prompt usage:', updateError);
      } else {
        console.log('✅ Successfully updated prompt usage');
      }
    } else {
      // Create new record
      console.log('✅ Creating new usage record');
      
      const { error: insertError } = await supabase
        .from('user_prompt_usage')
        .insert({
          user_id: userId,
          filter_id: filterId,
          filter_name: filterName,
          usage_count: 1,
          first_used_at: now,
          last_used_at: now,
        });

      if (insertError) {
        console.error('❌ Error inserting prompt usage:', insertError);
        console.error('Error details:', insertError.message, insertError.details);
      } else {
        console.log('✅ Successfully created prompt usage record');
      }
    }
  } catch (error) {
    console.error('❌ Error recording prompt usage:', error);
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
