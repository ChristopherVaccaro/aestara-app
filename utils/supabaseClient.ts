/**
 * Supabase Client Configuration
 * Provides a configured Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioasopowtifgaahldglq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXNvcG93dGlmZ2FhaGxkZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ4ODEsImV4cCI6MjA3NjQ2MDg4MX0.oM0eIOH5qDbIeYxq4zcQa7ZtgonoM7pEcWvvSLnPmLU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false, // No auth needed for anonymous voting
  },
  global: {
    headers: {
      'x-client-info': 'ai-image-stylizer',
    },
  },
  // Disable query caching for real-time vote updates
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
