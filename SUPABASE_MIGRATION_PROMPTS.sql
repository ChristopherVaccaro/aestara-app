-- Migration: Add style_prompts table for dynamic prompt management
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/seedglnzvhnbjwcfniup/sql

-- Create style_prompts table
CREATE TABLE IF NOT EXISTS style_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id TEXT UNIQUE NOT NULL,
  filter_name TEXT NOT NULL,
  current_prompt TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_generations INTEGER DEFAULT 0,
  net_feedback INTEGER DEFAULT 0,
  last_refinement_at TIMESTAMP WITH TIME ZONE,
  refinement_reason TEXT
);

-- Create index for fast lookups by filter_id
CREATE INDEX IF NOT EXISTS idx_style_prompts_filter_id ON style_prompts(filter_id);

-- Create index for finding prompts that need refinement
CREATE INDEX IF NOT EXISTS idx_style_prompts_feedback ON style_prompts(net_feedback);

-- Enable Row Level Security
ALTER TABLE style_prompts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can fetch prompts)
CREATE POLICY "Public read access for style_prompts"
ON style_prompts FOR SELECT
TO public
USING (true);

-- Allow public write access for updating stats (your app will handle this)
CREATE POLICY "Public update access for style_prompts"
ON style_prompts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public insert access for seeding initial prompts
CREATE POLICY "Public insert access for style_prompts"
ON style_prompts FOR INSERT
TO public
WITH CHECK (true);

-- Add prompt_version column to user_votes to track which version was voted on
ALTER TABLE user_votes ADD COLUMN IF NOT EXISTS prompt_version INTEGER DEFAULT 1;

-- Create index on prompt_version for analytics
CREATE INDEX IF NOT EXISTS idx_user_votes_prompt_version ON user_votes(prompt_version);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_style_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS set_style_prompts_updated_at ON style_prompts;
CREATE TRIGGER set_style_prompts_updated_at
BEFORE UPDATE ON style_prompts
FOR EACH ROW
EXECUTE FUNCTION update_style_prompts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE style_prompts IS 'Stores AI prompts for each art style with version tracking and feedback metrics';
COMMENT ON COLUMN style_prompts.filter_id IS 'Unique identifier for the filter (e.g., "anime", "watercolor")';
COMMENT ON COLUMN style_prompts.filter_name IS 'Display name of the filter';
COMMENT ON COLUMN style_prompts.current_prompt IS 'Current active prompt text used for image generation';
COMMENT ON COLUMN style_prompts.version IS 'Version number, incremented each time AI refines the prompt';
COMMENT ON COLUMN style_prompts.net_feedback IS 'Net feedback score (thumbs up - thumbs down)';
COMMENT ON COLUMN style_prompts.total_generations IS 'Total number of times this style has been used';
COMMENT ON COLUMN style_prompts.last_refinement_at IS 'Timestamp of last AI refinement';
COMMENT ON COLUMN style_prompts.refinement_reason IS 'Reason why the prompt was refined (e.g., "Net feedback reached -5")';

-- Function to increment generation count (for performance)
CREATE OR REPLACE FUNCTION increment_generation_count(p_filter_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE style_prompts
  SET total_generations = total_generations + 1
  WHERE filter_id = p_filter_id;
END;
$$ LANGUAGE plpgsql;
