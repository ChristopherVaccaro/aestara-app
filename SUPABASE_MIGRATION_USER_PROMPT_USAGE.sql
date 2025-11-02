-- Migration: Add user_prompt_usage table for tracking prompt usage per user
-- This table tracks how many times each user has used each prompt/filter

-- Create user_prompt_usage table
CREATE TABLE IF NOT EXISTS public.user_prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_id TEXT NOT NULL,
  filter_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_prompt_usage_user_id 
  ON public.user_prompt_usage(user_id);

-- Create index on filter_id
CREATE INDEX IF NOT EXISTS idx_user_prompt_usage_filter_id 
  ON public.user_prompt_usage(filter_id);

-- Create unique index to prevent duplicate entries per user+filter
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_prompt_usage_user_filter 
  ON public.user_prompt_usage(user_id, filter_id);

-- Enable Row Level Security
ALTER TABLE public.user_prompt_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own usage data
CREATE POLICY "Users can read own usage data"
  ON public.user_prompt_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own usage data
CREATE POLICY "Users can insert own usage data"
  ON public.user_prompt_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own usage data
CREATE POLICY "Users can update own usage data"
  ON public.user_prompt_usage
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_prompt_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_prompt_usage_updated_at_trigger
  BEFORE UPDATE ON public.user_prompt_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_prompt_usage_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_prompt_usage TO authenticated;
GRANT USAGE ON SEQUENCE user_prompt_usage_id_seq TO authenticated;

-- Comments
COMMENT ON TABLE public.user_prompt_usage IS 'Tracks how many times each user has used each filter/prompt';
COMMENT ON COLUMN public.user_prompt_usage.user_id IS 'Reference to the authenticated user';
COMMENT ON COLUMN public.user_prompt_usage.filter_id IS 'The filter ID (e.g., anime, vintage, etc.)';
COMMENT ON COLUMN public.user_prompt_usage.filter_name IS 'Human-readable filter name';
COMMENT ON COLUMN public.user_prompt_usage.usage_count IS 'Number of times this user has used this filter';
COMMENT ON COLUMN public.user_prompt_usage.first_used_at IS 'When the user first used this filter';
COMMENT ON COLUMN public.user_prompt_usage.last_used_at IS 'When the user most recently used this filter';
