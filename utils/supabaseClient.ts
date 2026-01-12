/**
 * Supabase Client Configuration
 * Provides a SINGLETON configured Supabase client for database operations
 * 
 * IMPORTANT: This is the ONLY place where createClient should be called.
 * All other files should import { supabase } from this file.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isDebugMode } from './supabaseDebug';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) ||
  process.env.SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  process.env.SUPABASE_ANON_KEY ||
  '';

// Singleton guard - ensure only one client exists
let _supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabaseInstance) {
    return _supabaseInstance;
  }

  if (isDebugMode()) {
    console.log('🔧 [Supabase] Creating singleton client instance');
  }

  _supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'ai-stylizer-auth',
      // Reduce auth debug noise in production
      debug: false,
    },
    global: {
      headers: {
        'x-client-info': 'ai-image-stylizer',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  // Warn in development if this is called multiple times (shouldn't happen)
  if (typeof window !== 'undefined' && isDebugMode()) {
    (window as any).__SUPABASE_CLIENT_COUNT = ((window as any).__SUPABASE_CLIENT_COUNT || 0) + 1;
    if ((window as any).__SUPABASE_CLIENT_COUNT > 1) {
      console.warn('⚠️ [Supabase] Multiple client instances detected! Check for duplicate imports.');
    }
  }

  return _supabaseInstance;
}

// Export the singleton instance
export const supabase = getSupabaseClient();
