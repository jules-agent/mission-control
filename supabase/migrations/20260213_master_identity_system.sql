-- Master Identity System Schema
-- Created: 2026-02-13
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: identities
CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES identities(id) ON DELETE SET NULL,
  is_base BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_base_per_user UNIQUE (user_id, is_base) WHERE is_base = true
);

-- Table: categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'music', 'philosophy', 'news', 'custom', etc.
  level INTEGER DEFAULT 1, -- nesting depth
  influence_curve_override JSONB, -- {type: 'exponential', alpha: 0.5}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: influences
CREATE TABLE influences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alignment DECIMAL(4,1) NOT NULL CHECK (alignment >= 0 AND alignment <= 100),
  position INTEGER NOT NULL, -- for sorting
  mood_tags TEXT[], -- ['mellow', 'atmospheric', 'energetic']
  metadata JSONB, -- artist bio, links, images, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  suggested_item TEXT NOT NULL,
  reasoning TEXT, -- "Based on your love of X, Y, Z..."
  shown_at TIMESTAMP WITH TIME ZONE,
  response TEXT, -- 'like', 'skip', 'dislike', NULL if not responded
  alignment DECIMAL(4,1), -- recorded if user likes/dislikes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: play_history
CREATE TABLE play_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  tool TEXT NOT NULL, -- 'soundtrack', 'newsletter', etc.
  influence_id UUID REFERENCES influences(id) ON DELETE SET NULL,
  context JSONB, -- {mood: 'mellow', time_of_day: 'morning', song_type: 'inspiration'}
  played_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: patterns
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'vocal_style', 'production_style', 'tempo', etc.
  pattern_value TEXT NOT NULL, -- 'theatrical vocals', 'reverb-heavy', etc.
  occurrences INTEGER DEFAULT 1,
  examples JSONB, -- [{song_id, feedback, timestamp}]
  suggested_at TIMESTAMP WITH TIME ZONE,
  user_response TEXT, -- 'applied', 'dismissed', 'show_more', NULL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: auto_switch_rules
CREATE TABLE auto_switch_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'schedule', 'location', 'calendar', 'manual_pattern'
  trigger_config JSONB NOT NULL, -- {days: ['sat', 'sun'], time_range: '9am-6pm'}
  priority INTEGER DEFAULT 0, -- higher = wins in conflicts
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_identities_user_id ON identities(user_id);
CREATE INDEX idx_identities_parent_id ON identities(parent_id);
CREATE INDEX idx_categories_identity_id ON categories(identity_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_influences_category_id ON influences(category_id);
CREATE INDEX idx_influences_alignment ON influences(alignment);
CREATE INDEX idx_influences_position ON influences(position);
CREATE INDEX idx_play_history_identity_id ON play_history(identity_id);
CREATE INDEX idx_play_history_played_at ON play_history(played_at);
CREATE INDEX idx_auto_switch_rules_user_id ON auto_switch_rules(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE influences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_switch_rules ENABLE ROW LEVEL SECURITY;

-- Identities: users can only access their own
CREATE POLICY "Users can view their own identities" ON identities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own identities" ON identities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own identities" ON identities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own identities" ON identities
  FOR DELETE USING (auth.uid() = user_id AND is_base = false); -- Can't delete base

-- Categories: access through identity ownership
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = categories.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = categories.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

-- Influences: access through category → identity ownership
CREATE POLICY "Users can view their own influences" ON influences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM categories 
      JOIN identities ON identities.id = categories.identity_id
      WHERE categories.id = influences.category_id 
      AND identities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own influences" ON influences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM categories 
      JOIN identities ON identities.id = categories.identity_id
      WHERE categories.id = influences.category_id 
      AND identities.user_id = auth.uid()
    )
  );

-- Recommendations: access through identity ownership
CREATE POLICY "Users can view their own recommendations" ON recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = recommendations.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own recommendations" ON recommendations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = recommendations.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

-- Play history: access through identity ownership
CREATE POLICY "Users can view their own play history" ON play_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = play_history.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own play history" ON play_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = play_history.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

-- Patterns: access through identity ownership
CREATE POLICY "Users can view their own patterns" ON patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = patterns.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own patterns" ON patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM identities 
      WHERE identities.id = patterns.identity_id 
      AND identities.user_id = auth.uid()
    )
  );

-- Auto-switch rules: users can only access their own
CREATE POLICY "Users can view their own auto-switch rules" ON auto_switch_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own auto-switch rules" ON auto_switch_rules
  FOR ALL USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_identities_updated_at BEFORE UPDATE ON identities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for Ben (if auth user exists)
-- This will be populated via API after first login
