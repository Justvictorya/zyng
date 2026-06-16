-- Run this in Supabase SQL Editor once
-- SECURITY DEFINER function: runs as table owner, bypasses RLS
-- Callable from the client with the anon key via supabase.rpc()

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
