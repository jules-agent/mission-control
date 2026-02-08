-- News Feedback Schema
-- Stores thumbs up/down + optional comments for learning

CREATE TABLE IF NOT EXISTS news_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES news_briefings(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('up', 'down')),
  comment TEXT, -- optional feedback on thumbs down
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_article ON news_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_feedback_vote ON news_feedback(vote);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON news_feedback(category);

-- RLS policies
ALTER TABLE news_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback" ON news_feedback FOR SELECT USING (true);
CREATE POLICY "Anyone can insert feedback" ON news_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update feedback" ON news_feedback FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete feedback" ON news_feedback FOR DELETE USING (true);
