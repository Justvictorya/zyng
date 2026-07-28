-- Adds engagement tracking to posts table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE posts ADD COLUMN IF NOT EXISTS engagement_data JSONB DEFAULT '{}'::jsonb;

-- engagement_data structure per platform:
-- {
--   "tiktok": { "likes": 120, "comments": 15, "shares": 8, "views": 5000, "fetched_at": "2026-07-27T12:00:00Z" },
--   "linkedin": { "likes": 45, "comments": 12, "shares": 3, "views": 800, "fetched_at": "2026-07-27T12:00:00Z" }
-- }
