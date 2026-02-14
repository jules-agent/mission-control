-- Identity System Admin Panel Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nqikobnkhpyfduqgfrew/sql

-- 1. Impersonation sessions table (optional - for audit trail)
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_token ON impersonation_sessions(token);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin ON impersonation_sessions(admin_id);

-- 2. Pending invites table (optional - for invite tracking)
CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email and token lookup
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites(invite_token);

-- Enable Row Level Security (RLS)
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role bypass - these tables are admin-only via service role key)
DROP POLICY IF EXISTS "Service role access only" ON impersonation_sessions;
DROP POLICY IF EXISTS "Service role access only" ON pending_invites;

CREATE POLICY "Service role access only" ON impersonation_sessions FOR ALL USING (false);
CREATE POLICY "Service role access only" ON pending_invites FOR ALL USING (false);

-- Note: Service role bypasses RLS, so these tables are effectively admin-only

-- Grant permissions
GRANT ALL ON impersonation_sessions TO service_role;
GRANT ALL ON pending_invites TO service_role;
