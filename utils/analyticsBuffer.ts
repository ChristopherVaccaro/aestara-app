/**
 * Analytics Buffer
 * Debounces and batches analytics writes to prevent DB exhaustion
 * 
 * Features:
 * - Debounced writes (minimum interval between writes)
 * - Batched queue that flushes periodically or on page hide
 * - Kill switch via env variable
 */

import { supabase } from './supabaseClient';
import { logDbCall, isCircuitOpen, recordFailure, recordSuccess, isDebugMode } from './supabaseDebug';

// Configuration
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const MIN_DEBOUNCE_MS = 1000; // Minimum 1 second between same-type writes
const MAX_QUEUE_SIZE = 50; // Force flush if queue gets too large

// Kill switch - disable analytics in dev if needed
const ANALYTICS_DISABLED = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_DISABLE_ANALYTICS === 'true'
  : false;

interface AnalyticsEvent {
  type: 'prompt_usage' | 'generation_count';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// In-memory queue
let eventQueue: AnalyticsEvent[] = [];
let lastFlush = 0;
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const lastWriteByType = new Map<string, number>();

/**
 * Queue an analytics event for batched writing
 */
export function queueAnalyticsEvent(
  type: AnalyticsEvent['type'],
  table: string,
  data: Record<string, unknown>
): void {
  if (ANALYTICS_DISABLED) {
    if (isDebugMode()) {
      console.log('📊 [Analytics] Disabled - skipping event:', type);
    }
    return;
  }

  // Debounce: skip if same type was queued too recently
  const key = `${type}:${JSON.stringify(data)}`;
  const lastWrite = lastWriteByType.get(key) || 0;
  const now = Date.now();
  
  if (now - lastWrite < MIN_DEBOUNCE_MS) {
    if (isDebugMode()) {
      console.log('📊 [Analytics] Debounced:', type);
    }
    return;
  }
  
  lastWriteByType.set(key, now);

  eventQueue.push({
    type,
    table,
    data,
    timestamp: now,
  });

  if (isDebugMode()) {
    console.log(`📊 [Analytics] Queued ${type}. Queue size: ${eventQueue.length}`);
  }

  // Force flush if queue is too large
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushQueue();
    return;
  }

  // Schedule flush if not already scheduled
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null;
      flushQueue();
    }, FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush the analytics queue to the database
 */
async function flushQueue(): Promise<void> {
  if (eventQueue.length === 0) return;

  // Check circuit breaker
  if (isCircuitOpen('analytics')) {
    if (isDebugMode()) {
      console.log('📊 [Analytics] Circuit breaker open - clearing queue');
    }
    eventQueue = [];
    return;
  }

  const eventsToFlush = [...eventQueue];
  eventQueue = [];
  lastFlush = Date.now();

  if (isDebugMode()) {
    console.log(`📊 [Analytics] Flushing ${eventsToFlush.length} events`);
  }

  // Group events by type for batch processing
  const promptUsageEvents = eventsToFlush.filter(e => e.type === 'prompt_usage');
  const generationCountEvents = eventsToFlush.filter(e => e.type === 'generation_count');

  try {
    // Process prompt usage updates
    for (const event of promptUsageEvents) {
      await processPromptUsageEvent(event);
    }

    // Process generation count increments (can be batched by filter_id)
    const countsByFilter = new Map<string, number>();
    for (const event of generationCountEvents) {
      const filterId = event.data.filter_id as string;
      countsByFilter.set(filterId, (countsByFilter.get(filterId) || 0) + 1);
    }

    for (const [filterId, count] of countsByFilter) {
      await incrementGenerationCountBatch(filterId, count);
    }

    recordSuccess('analytics');
  } catch (error) {
    console.error('📊 [Analytics] Flush failed:', error);
    recordFailure('analytics');
  }
}

/**
 * Process a single prompt usage event
 */
async function processPromptUsageEvent(event: AnalyticsEvent): Promise<void> {
  const { user_id, filter_id, filter_name } = event.data as {
    user_id: string;
    filter_id: string;
    filter_name: string;
  };

  logDbCall('user_prompt_usage', 'upsert');

  const now = new Date().toISOString();

  // Try to upsert (increment if exists, insert if not)
  const { data: existing } = await supabase
    .from('user_prompt_usage')
    .select('usage_count')
    .eq('user_id', user_id)
    .eq('filter_id', filter_id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_prompt_usage')
      .update({
        usage_count: existing.usage_count + 1,
        last_used_at: now,
      })
      .eq('user_id', user_id)
      .eq('filter_id', filter_id);
  } else {
    await supabase
      .from('user_prompt_usage')
      .insert({
        user_id,
        filter_id,
        filter_name,
        usage_count: 1,
        first_used_at: now,
        last_used_at: now,
      });
  }
}

/**
 * Batch increment generation count
 */
async function incrementGenerationCountBatch(filterId: string, count: number): Promise<void> {
  logDbCall('style_prompts', 'update');

  const { data: current, error: selectError } = await supabase
    .from('style_prompts')
    .select('total_generations')
    .eq('filter_id', filterId)
    .maybeSingle();

  if (selectError) {
    console.error('📊 [Analytics] Error fetching generation count:', selectError);
    return;
  }

  if (current) {
    const { error: updateError } = await supabase
      .from('style_prompts')
      .update({ total_generations: (current.total_generations || 0) + count })
      .eq('filter_id', filterId);
    
    if (updateError) {
      console.error('📊 [Analytics] Error updating generation count:', updateError);
    }
  }
}

// Flush on page hide/unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushQueue();
    }
  });

  window.addEventListener('beforeunload', () => {
    flushQueue();
  });
}

/**
 * Force flush (for testing or cleanup)
 */
export function forceFlush(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  return flushQueue();
}

/**
 * Get queue status (for debugging)
 */
export function getQueueStatus(): { queueSize: number; lastFlush: number } {
  return {
    queueSize: eventQueue.length,
    lastFlush,
  };
}
