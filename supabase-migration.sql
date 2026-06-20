-- Run this in your Supabase Dashboard > SQL Editor
-- Adds JSONB columns for media URLs and publish status on posts

ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS publish_results JSONB DEFAULT '[]'::jsonb;
