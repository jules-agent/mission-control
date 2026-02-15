-- Migrate existing influences to new 8 domains
-- Run this after domains are created
-- Ben's profile ID: ebf2c9c1-03fc-4f61-a856-4d5285454981

DO $$
DECLARE
  ben_id UUID := 'ebf2c9c1-03fc-4f61-a856-4d5285454981';
  old_music_id UUID;
  new_music_artists_id UUID;
  new_music_genres_id UUID;
  new_music_producers_id UUID;
  old_philosophy_id UUID;
  new_mind_thinkers_id UUID;
  influence_record RECORD;
BEGIN
  
  -- Get old Music category
  SELECT id INTO old_music_id FROM categories 
  WHERE profile_id = ben_id AND name = 'Music' AND parent_id IS NULL AND archived = false
  LIMIT 1;
  
  -- Get new Music > Artists subcategory
  SELECT c2.id INTO new_music_artists_id
  FROM categories c1
  JOIN categories c2 ON c2.parent_id = c1.id
  WHERE c1.profile_id = ben_id 
    AND c1.name = 'Music' 
    AND c1.parent_id IS NULL
    AND c2.name = 'Artists'
  LIMIT 1;
  
  -- Get new Music > Genres
  SELECT c2.id INTO new_music_genres_id
  FROM categories c1
  JOIN categories c2 ON c2.parent_id = c1.id
  WHERE c1.profile_id = ben_id 
    AND c1.name = 'Music' 
    AND c2.name = 'Genres'
  LIMIT 1;
  
  -- Get new Music > Producers
  SELECT c2.id INTO new_music_producers_id
  FROM categories c1
  JOIN categories c2 ON c2.parent_id = c1.id
  WHERE c1.profile_id = ben_id 
    AND c1.name = 'Music' 
    AND c2.name = 'Producers'
  LIMIT 1;
  
  -- Copy music influences to appropriate subcategories
  -- This is a simplified version - in practice you'd need logic to determine which subcategory
  IF old_music_id IS NOT NULL AND new_music_artists_id IS NOT NULL THEN
    -- Copy all music influences to Artists for now (can be refined later)
    INSERT INTO influences (category_id, name, alignment, position, created_at, updated_at)
    SELECT new_music_artists_id, name, alignment, position, created_at, NOW()
    FROM influences
    WHERE category_id = old_music_id
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Copied music influences to new Artists category';
  END IF;
  
  -- Get old Philosophy category
  SELECT id INTO old_philosophy_id FROM categories 
  WHERE profile_id = ben_id AND name = 'Philosophy' AND parent_id IS NULL AND archived = false
  LIMIT 1;
  
  -- Get new Mind & Philosophy > Thinkers & Influencers
  SELECT c2.id INTO new_mind_thinkers_id
  FROM categories c1
  JOIN categories c2 ON c2.parent_id = c1.id
  WHERE c1.profile_id = ben_id 
    AND c1.name = 'Mind & Philosophy' 
    AND c2.name = 'Thinkers & Influencers'
  LIMIT 1;
  
  -- Copy philosophy influences
  IF old_philosophy_id IS NOT NULL AND new_mind_thinkers_id IS NOT NULL THEN
    INSERT INTO influences (category_id, name, alignment, position, created_at, updated_at)
    SELECT new_mind_thinkers_id, name, alignment, position, created_at, NOW()
    FROM influences
    WHERE category_id = old_philosophy_id
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Copied philosophy influences to new Thinkers category';
  END IF;
  
  -- Mark old categories as archived (soft delete)
  UPDATE categories
  SET archived = true, archived_at = NOW(), migration_notes = 'Migrated to new 8-domain structure Feb 15, 2026'
  WHERE profile_id = ben_id
    AND parent_id IS NULL
    AND name IN ('Music', 'Philosophy', 'Food', 'Fashion', 'Automotive', 'Home', 'Entertainment', 'Gaming', 'Parenting', 'Values', 'Daily', 'News', 'Business', 'Fitness', 'Gifts')
    AND archived = false;
  
  RAISE NOTICE 'Migration complete - old categories archived';
  
END $$;
