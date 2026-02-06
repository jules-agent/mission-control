-- Create agent_status table for Mission Control model tracking
-- Single-row table design for centralized status

CREATE TABLE IF NOT EXISTS agent_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_model TEXT NOT NULL DEFAULT 'nvidia/moonshotai/kimi-k2.5',
  models_json JSONB NOT NULL DEFAULT '[
    {"name": "Kimi K2.5", "role": "Default / Day-to-Day", "icon": "💬", "status": "active"},
    {"name": "Opus 4.5", "role": "Complex Tasks", "icon": "🧠", "status": "standby"},
    {"name": "Codex CLI", "role": "Development", "icon": "⚡", "status": "standby"}
  ]'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'initial'
);

-- RLS Policies for agent_status
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (dashboard is public)
CREATE POLICY "agent_status readable by everyone" ON agent_status
  FOR SELECT USING (true);

-- Allow service role to update
CREATE POLICY "agent_status updatable by service role" ON agent_status
  FOR ALL USING (auth.role() = 'service_role');

-- Insert initial row if not exists (Kimi default)
INSERT INTO agent_status (id, active_model, models_json, last_updated, source)
VALUES (
  1,
  'nvidia/moonshotai/kimi-k2.5',
  '[
    {"name": "Kimi K2.5", "role": "Default / Day-to-Day", "icon": "💬", "status": "active"},
    {"name": "Opus 4.5", "role": "Complex Tasks", "icon": "🧠", "status": "standby"},
    {"name": "Codex CLI", "role": "Development", "icon": "⚡", "status": "standby"}
  ]'::jsonb,
  NOW(),
  'initial_seed'
)
ON CONFLICT (id) DO UPDATE SET
  last_updated = EXCLUDED.last_updated;
