-- Domain Consolidation Script
-- Migrates 61 categories → 8 core domains
-- Date: 2026-02-15
-- CRITICAL: Soft migration only - NO data deletion

-- Step 1: Create 8 new core domains (for profile: Ben Schaffer)
-- Profile ID: ebf2c9c1-03fc-4f61-a856-4d5285454981

DO $$
DECLARE
  ben_profile_id UUID := 'ebf2c9c1-03fc-4f61-a856-4d5285454981';
  music_domain_id UUID;
  mind_domain_id UUID;
  food_domain_id UUID;
  style_domain_id UUID;
  entertainment_domain_id UUID;
  family_domain_id UUID;
  work_domain_id UUID;
  lifestyle_domain_id UUID;
BEGIN
  
  -- 🎵 Music Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Music', 'music', 0, true, 'unrestricted')
  RETURNING id INTO music_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, music_domain_id, 'Artists', 'artists', 1),
    (ben_profile_id, music_domain_id, 'Genres', 'genres', 1),
    (ben_profile_id, music_domain_id, 'Producers', 'producers', 1),
    (ben_profile_id, music_domain_id, 'Eras', 'eras', 1),
    (ben_profile_id, music_domain_id, 'Moods', 'moods', 1);
  
  -- 🧠 Mind & Philosophy Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Mind & Philosophy', 'philosophy', 0, true, 'unrestricted')
  RETURNING id INTO mind_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, mind_domain_id, 'Thinkers & Influencers', 'thinkers', 1),
    (ben_profile_id, mind_domain_id, 'Philosophy Schools', 'schools', 1),
    (ben_profile_id, mind_domain_id, 'Themes & Concepts', 'themes', 1),
    (ben_profile_id, mind_domain_id, 'Books & Reading', 'books', 1);
  
  -- 🍽️ Food & Dining Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Food & Dining', 'food', 0, true, 'unrestricted')
  RETURNING id INTO food_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, food_domain_id, 'Cuisines', 'food', 1),
    (ben_profile_id, food_domain_id, 'Restaurants', 'food', 1),
    (ben_profile_id, food_domain_id, 'Dietary Framework', 'food', 1);
  
  -- 👔 Style & Aesthetics Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Style & Aesthetics', 'fashion', 0, true, 'unrestricted')
  RETURNING id INTO style_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, style_domain_id, 'Fashion & Apparel', 'fashion', 1),
    (ben_profile_id, style_domain_id, 'Automotive', 'automotive', 1),
    (ben_profile_id, style_domain_id, 'Home & Design', 'home', 1);
  
  -- 🎬 Entertainment & Media Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Entertainment & Media', 'entertainment', 0, true, 'unrestricted')
  RETURNING id INTO entertainment_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, entertainment_domain_id, 'TV Shows', 'entertainment', 1),
    (ben_profile_id, entertainment_domain_id, 'Movies', 'entertainment', 1),
    (ben_profile_id, entertainment_domain_id, 'Gaming', 'gaming', 1),
    (ben_profile_id, entertainment_domain_id, 'Comedy', 'entertainment', 1);
  
  -- 👨‍👩‍👦 Family & Parenting Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Family & Parenting', 'parenting', 0, true, 'family')
  RETURNING id INTO family_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, family_domain_id, 'Parenting Philosophy', 'parenting', 1),
    (ben_profile_id, family_domain_id, 'Family Values', 'values', 1),
    (ben_profile_id, family_domain_id, 'Family Activities', 'daily', 1);
  
  -- 💼 Work & Business Domain (PRIVATE by default)
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Work & Business', 'business', 0, false, 'private')
  RETURNING id INTO work_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode) VALUES
    (ben_profile_id, work_domain_id, 'News Sources', 'news', 1, false, 'private'),
    (ben_profile_id, work_domain_id, 'Business Philosophy', 'business', 1, false, 'private'),
    (ben_profile_id, work_domain_id, 'Communication Style', 'communication', 1, false, 'private');
  
  -- 🏃 Lifestyle & Wellness Domain
  INSERT INTO categories (profile_id, parent_id, name, type, level, is_shareable, sharing_mode)
  VALUES (ben_profile_id, NULL, 'Lifestyle & Wellness', 'lifestyle', 0, true, 'unrestricted')
  RETURNING id INTO lifestyle_domain_id;
  
  INSERT INTO categories (profile_id, parent_id, name, type, level) VALUES
    (ben_profile_id, lifestyle_domain_id, 'Fitness & Exercise', 'fitness', 1),
    (ben_profile_id, lifestyle_domain_id, 'Health & Nutrition', 'lifestyle', 1),
    (ben_profile_id, lifestyle_domain_id, 'Daily Routines', 'daily', 1),
    (ben_profile_id, lifestyle_domain_id, 'Hobbies & Interests', 'lifestyle', 1),
    (ben_profile_id, lifestyle_domain_id, 'Gifts & Shopping', 'gifts', 1);

  RAISE NOTICE 'Created 8 core domains with % total categories', 
    8 + 5 + 4 + 3 + 3 + 4 + 3 + 3 + 5; -- 38 categories total

END $$;

-- Step 2: Mark existing categories as archived (soft delete)
-- This preserves all data while hiding them from default views

ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS migrated_to_category_id UUID REFERENCES categories(id);

-- Mark all non-domain categories as archived (will do manual migration mapping later)
-- For now, just add the columns and set migration targets in next phase

COMMENT ON COLUMN categories.archived IS 'Soft delete flag - hides from UI but preserves data';
COMMENT ON COLUMN categories.archived_at IS 'Timestamp when category was archived';
COMMENT ON COLUMN categories.migrated_to_category_id IS 'Points to new domain category after consolidation';

-- Step 3: Create index for archived queries
CREATE INDEX IF NOT EXISTS idx_categories_active 
  ON categories(profile_id, archived) 
  WHERE archived = false;

-- Step 4: Add migration metadata
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS migration_notes TEXT;

COMMENT ON COLUMN categories.migration_notes IS 'Human-readable notes about why/how this category was migrated or archived';

-- Migration will be completed in next phase after reviewing the mapping
-- This phase just creates the infrastructure

SELECT 'Domain consolidation structure created. Next: map old categories to new domains.' AS status;
