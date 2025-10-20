-- Migration: Add feedback tags system for detailed user feedback
-- This enables users to select specific issues when voting down

-- 1. Create feedback_tags table (predefined tags)
CREATE TABLE IF NOT EXISTS feedback_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_key TEXT UNIQUE NOT NULL,
  tag_label TEXT NOT NULL,
  tag_description TEXT,
  category TEXT NOT NULL, -- 'quality', 'style', 'preservation', 'technical'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create vote_feedback table (links votes to selected tags)
CREATE TABLE IF NOT EXISTS vote_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_vote_id UUID NOT NULL REFERENCES user_votes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES feedback_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_vote_id, tag_id)
);

-- 3. Add feedback_summary JSONB column to style_prompts for aggregated tag data
ALTER TABLE style_prompts ADD COLUMN IF NOT EXISTS feedback_summary JSONB DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_tags_category ON feedback_tags(category);
CREATE INDEX IF NOT EXISTS idx_feedback_tags_active ON feedback_tags(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vote_feedback_user_vote ON vote_feedback(user_vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_feedback_tag ON vote_feedback(tag_id);
CREATE INDEX IF NOT EXISTS idx_style_prompts_feedback_summary ON style_prompts USING GIN (feedback_summary);

-- Enable RLS
ALTER TABLE feedback_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for feedback_tags
DROP POLICY IF EXISTS "Public read access for feedback_tags" ON feedback_tags;
CREATE POLICY "Public read access for feedback_tags"
ON feedback_tags FOR SELECT
TO public
USING (is_active = true);

-- Public write access for vote_feedback
DROP POLICY IF EXISTS "Public insert access for vote_feedback" ON vote_feedback;
CREATE POLICY "Public insert access for vote_feedback"
ON vote_feedback FOR INSERT
TO public
WITH CHECK (true);

-- Public read access for vote_feedback (for analytics)
DROP POLICY IF EXISTS "Public read access for vote_feedback" ON vote_feedback;
CREATE POLICY "Public read access for vote_feedback"
ON vote_feedback FOR SELECT
TO public
USING (true);

-- Seed initial feedback tags
INSERT INTO feedback_tags (tag_key, tag_label, tag_description, category, sort_order) VALUES
  -- Quality Issues
  ('too_blurry', 'Too Blurry', 'Result lacks sharpness and detail', 'quality', 1),
  ('too_abstract', 'Too Abstract', 'Style is too abstract or unrecognizable', 'quality', 2),
  ('low_quality', 'Low Quality', 'Overall quality is poor', 'quality', 3),
  ('artifacts', 'Visual Artifacts', 'Strange artifacts or glitches in the image', 'quality', 4),
  ('colors_off', 'Colors Off', 'Colors are too saturated, muted, or incorrect', 'quality', 5),
  
  -- Style Issues
  ('wrong_style', 'Wrong Style', 'Does not match the expected art style', 'style', 10),
  ('inconsistent_style', 'Inconsistent Style', 'Style is applied unevenly', 'style', 11),
  ('not_enough_style', 'Too Subtle', 'Style transformation is too subtle', 'style', 12),
  ('too_stylized', 'Over-Stylized', 'Style is too heavy-handed or exaggerated', 'style', 13),
  
  -- Preservation Issues
  ('lost_face', 'Lost Facial Features', 'Face structure or features are distorted', 'preservation', 20),
  ('wrong_expression', 'Changed Expression', 'Facial expression was altered incorrectly', 'preservation', 21),
  ('lost_details', 'Lost Important Details', 'Clothing, accessories, or background details lost', 'preservation', 22),
  ('wrong_proportions', 'Wrong Proportions', 'Body or facial proportions are incorrect', 'preservation', 23),
  ('identity_lost', 'Person Unrecognizable', 'The person no longer looks like themselves', 'preservation', 24),
  
  -- Technical Issues
  ('safety_filter', 'Safety Filter Triggered', 'Result was blocked or censored', 'technical', 30),
  ('incomplete', 'Incomplete Generation', 'Image appears unfinished', 'technical', 31),
  ('wrong_composition', 'Composition Changed', 'Overall layout or framing was altered', 'technical', 32),
  ('lighting_issues', 'Lighting Problems', 'Lighting is too harsh, flat, or incorrect', 'technical', 33)
ON CONFLICT (tag_key) DO NOTHING;

-- Function to aggregate feedback tags for a filter
CREATE OR REPLACE FUNCTION update_feedback_summary(p_filter_id TEXT)
RETURNS VOID AS $$
DECLARE
  tag_counts JSONB;
BEGIN
  -- Get tag counts from the last 100 votes
  SELECT jsonb_object_agg(ft.tag_key, tag_data.count)
  INTO tag_counts
  FROM (
    SELECT 
      vf.tag_id,
      COUNT(*) as count
    FROM vote_feedback vf
    JOIN user_votes uv ON uv.id = vf.user_vote_id
    WHERE uv.filter_name = p_filter_id
      AND uv.vote_type = 'down'
      AND uv.created_at > NOW() - INTERVAL '30 days'
    GROUP BY vf.tag_id
    ORDER BY count DESC
    LIMIT 20
  ) tag_data
  JOIN feedback_tags ft ON ft.id = tag_data.tag_id;

  -- Update style_prompts with aggregated data
  UPDATE style_prompts
  SET feedback_summary = COALESCE(tag_counts, '{}'::jsonb)
  WHERE filter_id = p_filter_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE feedback_tags IS 'Predefined feedback tags users can select when voting';
COMMENT ON TABLE vote_feedback IS 'Links user votes to specific feedback tags';
COMMENT ON COLUMN style_prompts.feedback_summary IS 'Aggregated feedback tag counts for this style (updated periodically)';
COMMENT ON FUNCTION update_feedback_summary IS 'Aggregates feedback tags for a filter and updates style_prompts.feedback_summary';
