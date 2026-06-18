-- Run this in your Supabase Dashboard > SQL Editor
-- Adds a JSONB column for storing media URLs on posts

ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
