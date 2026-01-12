-- ============================================================================
-- SUPABASE CLEANUP MIGRATION
-- Run this in Supabase SQL Editor to clean up unused tables, indexes, and fix RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP VOTE-RELATED TABLES (CASCADE will drop dependent objects)
-- ============================================================================

-- Drop vote_feedback table first (has foreign key to user_votes)
DROP TABLE IF EXISTS public.vote_feedback CASCADE;

-- Drop feedback_tags table
DROP TABLE IF EXISTS public.feedback_tags CASCADE;

-- Drop user_votes table
DROP TABLE IF EXISTS public.user_votes CASCADE;

-- Drop style_votes table (legacy)
DROP TABLE IF EXISTS public.style_votes CASCADE;

-- Drop prompt_overrides table (used for vote-triggered prompt changes)
DROP TABLE IF EXISTS public.prompt_overrides CASCADE;

-- ============================================================================
-- STEP 2: DROP UNUSED INDEXES ON REMAINING TABLES
-- ============================================================================

-- Gallery table indexes
DROP INDEX IF EXISTS public.idx_gallery_user_id;
DROP INDEX IF EXISTS public.idx_gallery_created_at;

-- Purchases table
DROP INDEX IF EXISTS public.idx_purchases_user_id;

-- Style prompts table
DROP INDEX IF EXISTS public.idx_style_prompts_filter_id;
DROP INDEX IF EXISTS public.idx_style_prompts_feedback;
DROP INDEX IF EXISTS public.idx_style_prompts_feedback_summary;

-- User subscriptions table
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_tier;
DROP INDEX IF EXISTS public.idx_user_subscriptions_status;
DROP INDEX IF EXISTS public.idx_user_subscriptions_stripe_customer;

-- Usage tracking table
DROP INDEX IF EXISTS public.idx_usage_tracking_user_id;
DROP INDEX IF EXISTS public.idx_usage_tracking_action_type;
DROP INDEX IF EXISTS public.idx_usage_tracking_created_at;

-- User prompt usage table
DROP INDEX IF EXISTS public.idx_user_prompt_usage_user_id;
DROP INDEX IF EXISTS public.idx_user_prompt_usage_filter_id;

-- ============================================================================
-- STEP 3: FIX RLS POLICIES - Replace auth.uid() with (select auth.uid())
-- This prevents re-evaluation for each row and improves performance
-- ============================================================================

-- user_prompt_usage table policies
DROP POLICY IF EXISTS "Users can read own usage data" ON public.user_prompt_usage;
DROP POLICY IF EXISTS "Users can insert own usage data" ON public.user_prompt_usage;
DROP POLICY IF EXISTS "Users can update own usage data" ON public.user_prompt_usage;

CREATE POLICY "Users can read own usage data" ON public.user_prompt_usage
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own usage data" ON public.user_prompt_usage
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own usage data" ON public.user_prompt_usage
  FOR UPDATE USING (user_id = (select auth.uid()));

-- user_subscriptions table policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (user_id = (select auth.uid()));

-- Service role policy - restrict to service_role only, not all roles
CREATE POLICY "Service role full access to subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- usage_tracking table policies  
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Service role full access to usage" ON public.usage_tracking;

CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (user_id = (select auth.uid()));

-- Service role policy - restrict to service_role only
CREATE POLICY "Service role full access to usage" ON public.usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

-- gallery table policies
DROP POLICY IF EXISTS "Users can view own gallery" ON public.gallery;
DROP POLICY IF EXISTS "Users can insert to own gallery" ON public.gallery;
DROP POLICY IF EXISTS "Users can update own gallery items" ON public.gallery;
DROP POLICY IF EXISTS "Users can delete own gallery items" ON public.gallery;

CREATE POLICY "Users can view own gallery" ON public.gallery
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert to own gallery" ON public.gallery
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own gallery items" ON public.gallery
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own gallery items" ON public.gallery
  FOR DELETE USING (user_id = (select auth.uid()));

-- purchases table policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own purchases" ON public.purchases
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- STEP 4: CLEAN UP style_prompts table - remove vote-related columns
-- ============================================================================

-- Remove vote-related columns from style_prompts if they exist
ALTER TABLE public.style_prompts 
  DROP COLUMN IF EXISTS net_feedback,
  DROP COLUMN IF EXISTS feedback_summary;

-- ============================================================================
-- DONE! Verify the cleanup was successful
-- ============================================================================

-- Run this query to verify tables were dropped:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Run this query to check for any remaining vote-related tables:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%vote%';
