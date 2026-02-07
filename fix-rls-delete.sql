-- Add DELETE policy for service role
CREATE POLICY "Service role can delete briefings"
  ON news_briefings FOR DELETE
  USING (true);
