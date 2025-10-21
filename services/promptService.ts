/**
 * Prompt Service
 * Manages dynamic prompt fetching and caching from Supabase
 */

import { supabase } from '../utils/supabaseClient';
import { Filter } from '../types';

interface StylePrompt {
  id: string;
  filter_id: string;
  filter_name: string;
  current_prompt: string;
  version: number;
  net_feedback: number;
  total_generations: number;
}

// In-memory cache for prompts (refreshed periodically)
let promptCache: Map<string, StylePrompt> = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all prompts from Supabase and update cache
 */
export async function refreshPromptCache(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('style_prompts')
      .select('*')
      .order('filter_id', { ascending: true });

    if (error) {
      console.error('Error fetching prompts from Supabase:', error);
      return;
    }

    if (data) {
      promptCache.clear();
      data.forEach((prompt: StylePrompt) => {
        promptCache.set(prompt.filter_id, prompt);
      });
      lastCacheUpdate = Date.now();
      console.log(`✅ Loaded ${data.length} prompts from Supabase`);
    }
  } catch (err) {
    console.error('Exception refreshing prompt cache:', err);
  }
}

/**
 * Get a specific prompt by filter_id
 * Returns cached version if available, otherwise fetches from DB
 */
export async function getPrompt(filterId: string): Promise<string | null> {
  // Refresh cache if expired
  if (Date.now() - lastCacheUpdate > CACHE_DURATION) {
    await refreshPromptCache();
  }

  // Try cache first
  const cached = promptCache.get(filterId);
  if (cached) {
    return cached.current_prompt;
  }

  // Fallback: fetch directly from DB
  try {
    const { data, error } = await supabase
      .from('style_prompts')
      .select('current_prompt')
      .eq('filter_id', filterId)
      .single();

    if (error || !data) {
      console.warn(`Prompt not found for filter_id: ${filterId}`);
      return null;
    }

    return data.current_prompt;
  } catch (err) {
    console.error(`Error fetching prompt for ${filterId}:`, err);
    return null;
  }
}

/**
 * Get prompt version for a filter
 */
export async function getPromptVersion(filterId: string): Promise<number> {
  const cached = promptCache.get(filterId);
  if (cached) {
    return cached.version;
  }

  try {
    const { data, error } = await supabase
      .from('style_prompts')
      .select('version')
      .eq('filter_id', filterId)
      .single();

    if (error || !data) {
      return 1; // Default version
    }

    return data.version;
  } catch (err) {
    console.error(`Error fetching version for ${filterId}:`, err);
    return 1;
  }
}

/**
 * Update prompt in database (called after AI refinement)
 */
export async function updatePrompt(
  filterId: string,
  newPrompt: string,
  refinementReason: string
): Promise<boolean> {
  try {
    // Get current version
    const { data: current, error: fetchError } = await supabase
      .from('style_prompts')
      .select('version, net_feedback')
      .eq('filter_id', filterId)
      .single();

    if (fetchError || !current) {
      console.error('Error fetching current prompt data:', fetchError);
      return false;
    }

    const newVersion = current.version + 1;

    // Update with new prompt and version
    const { error: updateError } = await supabase
      .from('style_prompts')
      .update({
        current_prompt: newPrompt,
        version: newVersion,
        net_feedback: 0, // Reset feedback for new version
        last_refinement_at: new Date().toISOString(),
        refinement_reason: refinementReason,
      })
      .eq('filter_id', filterId);

    if (updateError) {
      console.error('Error updating prompt:', updateError);
      return false;
    }

    console.log(`✅ Updated prompt for ${filterId} to version ${newVersion}`);

    // Invalidate cache to force refresh
    lastCacheUpdate = 0;
    await refreshPromptCache();

    return true;
  } catch (err) {
    console.error('Exception updating prompt:', err);
    return false;
  }
}

/**
 * Increment generation count for a filter
 */
export async function incrementGenerationCount(filterId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_generation_count', {
      p_filter_id: filterId,
    });

    if (error) {
      // If function doesn't exist, fall back to manual update
      const { data: current } = await supabase
        .from('style_prompts')
        .select('generation_count')
        .eq('filter_id', filterId)
        .single();

      if (current) {
        await supabase
          .from('style_prompts')
          .update({ generation_count: (current.generation_count || 0) + 1 })
          .eq('filter_id', filterId);
      }
    }
  } catch (err) {
    console.error('Error incrementing generation count:', err);
  }
}

/**
 * Update net feedback for a filter
 */
export async function updateNetFeedback(
  filterId: string,
  delta: number // +1 for thumbs up, -1 for thumbs down
): Promise<void> {
  try {
    const { data: current } = await supabase
      .from('style_prompts')
      .select('net_feedback')
      .eq('filter_id', filterId)
      .single();

    if (current) {
      await supabase
        .from('style_prompts')
        .update({ net_feedback: current.net_feedback + delta })
        .eq('filter_id', filterId);
    }
  } catch (err) {
    console.error('Error updating net feedback:', err);
  }
}

/**
 * Get prompts that need refinement (net_feedback <= -5)
 */
export async function getPromptsNeedingRefinement(): Promise<StylePrompt[]> {
  try {
    const { data, error } = await supabase
      .from('style_prompts')
      .select('*')
      .lte('net_feedback', -5)
      .order('net_feedback', { ascending: true });

    if (error) {
      console.error('Error fetching prompts needing refinement:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception getting prompts needing refinement:', err);
    return [];
  }
}

/**
 * Seed initial prompt into database
 */
export async function seedPrompt(filter: Filter): Promise<void> {
  try {
    const { error } = await supabase
      .from('style_prompts')
      .upsert({
        filter_id: filter.id,
        filter_name: filter.name,
        current_prompt: filter.prompt,
        version: 1,
        net_feedback: 0,
        total_generations: 0,
      }, {
        onConflict: 'filter_id',
      });

    if (error) {
      console.error(`Error seeding prompt for ${filter.id}:`, error);
    }
  } catch (err) {
    console.error(`Exception seeding prompt for ${filter.id}:`, err);
  }
}

/**
 * Seed all prompts from an array of filters
 */
export async function seedAllPrompts(filters: Filter[]): Promise<void> {
  console.log(`Seeding ${filters.length} prompts to database...`);
  const promises = filters.map(filter => seedPrompt(filter));
  await Promise.all(promises);
  console.log('✅ All prompts seeded successfully');
  await refreshPromptCache();
}

// Initialize cache on module load
refreshPromptCache();
