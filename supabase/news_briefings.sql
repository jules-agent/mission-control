-- Daily News Briefings Schema
-- Stores daily morning briefing articles with categories, images, links

CREATE TABLE IF NOT EXISTS news_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'tesla_ev', 'crypto', 'stocks', 'whisky', 'tech', 'la_food', 'business'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique articles per day/category
  UNIQUE(briefing_date, url)
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_briefing_date ON news_briefings(briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_category ON news_briefings(category);

-- RLS policies (allow authenticated reads)
ALTER TABLE news_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news briefings"
  ON news_briefings FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert briefings"
  ON news_briefings FOR INSERT
  WITH CHECK (true);

-- View for latest briefing
CREATE OR REPLACE VIEW latest_briefing AS
SELECT 
  briefing_date,
  category,
  json_agg(
    json_build_object(
      'id', id,
      'title', title,
      'summary', summary,
      'url', url,
      'image_url', image_url,
      'source', source
    ) ORDER BY created_at DESC
  ) as articles
FROM news_briefings
WHERE briefing_date = (SELECT MAX(briefing_date) FROM news_briefings)
GROUP BY briefing_date, category;
