-- Team accounts for Enterprise tier
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  member_id UUID,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ
);

-- Index for fast lookups by owner
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);

-- Index for member lookups
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Owner can see all members
CREATE POLICY "Owner can manage team members"
  ON team_members
  FOR ALL
  USING (owner_id = auth.uid());

-- Members can see their own team
CREATE POLICY "Members can see their team"
  ON team_members
  FOR SELECT
  USING (member_id = auth.uid());
