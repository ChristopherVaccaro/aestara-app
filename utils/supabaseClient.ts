/**
 * Supabase Client Configuration
 * Provides a configured Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) ||
  process.env.SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  process.env.SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'ai-stylizer-auth',
    debug: typeof import.meta !== 'undefined' ? ((import.meta as any).env?.MODE !== 'production') : false,
  },
  global: {
    headers: {
      'x-client-info': 'ai-image-stylizer',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  // Disable query caching for real-time vote updates
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
