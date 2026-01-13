-- =====================================================
-- Aestara Gallery Performance Fix
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add composite index for gallery queries (fixes statement timeout 57014)
-- This index optimizes: SELECT ... WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_gallery_user_created 
ON gallery (user_id, created_at DESC);

-- 2. Add index on user_id alone for faster lookups
CREATE INDEX IF NOT EXISTS idx_gallery_user_id 
ON gallery (user_id);

-- 3. Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'gallery';

-- =====================================================
-- Storage Policy Review (Optional)
-- =====================================================
-- Aestara uses bucket-level policies which work correctly.
-- If you want schema-level policies like Glamatron, run:

-- DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- CREATE POLICY "Users can upload to gallery-images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'gallery-images' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Users can read from gallery-images"  
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'gallery-images');

-- CREATE POLICY "Users can delete own gallery images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'gallery-images'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
