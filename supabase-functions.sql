-- Run this in Supabase SQL Editor once
-- ============================================
-- Creates the connected_accounts table if missing,
-- defines SECURITY DEFINER RPCs for upsert + query,
-- and grants execute to anon role so the server can call them.

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS connected_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_user_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- 2. Upsert function (6 params — the server uses a separate call to save refresh_token)
CREATE OR REPLACE FUNCTION upsert_connected_account(
  p_user_id UUID,
  p_platform TEXT,
  p_platform_user_id TEXT,
  p_platform_user_name TEXT,
  p_access_token TEXT,
  p_token_expires_at TIMESTAMPTZ
) RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO connected_accounts (
    user_id, platform, platform_user_id, platform_user_name,
    access_token, token_expires_at
  ) VALUES (
    p_user_id, p_platform, p_platform_user_id, p_platform_user_name,
    p_access_token, p_token_expires_at
  )
  ON CONFLICT (user_id, platform) DO UPDATE SET
    platform_user_id = EXCLUDED.platform_user_id,
    platform_user_name = EXCLUDED.platform_user_name,
    access_token = EXCLUDED.access_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = now();
END;
$$;

-- 3. Get all connected accounts for a user
CREATE OR REPLACE FUNCTION get_connected_accounts(
  p_user_id UUID
) RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  platform TEXT,
  platform_user_id TEXT,
  platform_user_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT ca.id, ca.user_id, ca.platform, ca.platform_user_id,
         ca.platform_user_name, ca.access_token, ca.refresh_token,
         ca.token_expires_at, ca.created_at, ca.updated_at
  FROM connected_accounts ca
  WHERE ca.user_id = p_user_id
  ORDER BY ca.platform;
END;
$$;

-- 4. Grant execute so the anon / service-role keys can invoke the functions
GRANT EXECUTE ON FUNCTION upsert_connected_account TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_connected_accounts TO anon, authenticated, service_role;
