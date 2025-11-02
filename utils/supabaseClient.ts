/**
 * Supabase Client Configuration
 * Provides a configured Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://seedglnzvhnbjwcfniup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZWRnbG56dmhuYmp3Y2ZuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDg5OTksImV4cCI6MjA3NjQ4NDk5OX0.j7ATY4CN9554aLmyBakB9ImKtfa9DXsCTY1iHMMdVdY';

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
    debug: true, // Enable debug logging for auth issues
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
