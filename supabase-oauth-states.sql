CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  csrf TEXT NOT NULL,
  code_verifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state_id ON oauth_states(state_id);

-- Cleanup old states (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_oauth_states() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM oauth_states WHERE created_at < now() - interval '10 minutes';
END;
$$;
