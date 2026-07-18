-- Add processing_at column to prevent scheduler from re-processing the same post
ALTER TABLE posts ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ DEFAULT NULL;
