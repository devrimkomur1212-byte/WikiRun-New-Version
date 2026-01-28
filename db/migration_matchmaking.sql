-- WikiRun Matchmaking Migration
-- Run this in your Supabase SQL editor AFTER running the initial migrations.sql

-- ===========================================
-- 1. Add start_time to matches table
-- ===========================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;

-- ===========================================
-- 2. Add elo_rating to queue_ranked table
-- ===========================================
ALTER TABLE queue_ranked ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000;

-- Make route_id nullable (we set it when matched, not when queueing)
ALTER TABLE queue_ranked ALTER COLUMN route_id DROP NOT NULL;

-- ===========================================
-- 3. Add indexes for ELO-based matching
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_queue_ranked_elo ON queue_ranked(elo_rating);
CREATE INDEX IF NOT EXISTS idx_queue_ranked_queued_at ON queue_ranked(queued_at);

-- ===========================================
-- 4. Enable Supabase Realtime on matches table
-- ===========================================
-- This allows clients to subscribe to match changes
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- ===========================================
-- 5. Update RLS policies for service role access
-- ===========================================

-- Allow service role to insert matches (for matchmaking)
CREATE POLICY "Service role can insert matches"
  ON matches FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update matches (for setting run IDs, winner, etc.)
CREATE POLICY "Service role can update matches"
  ON matches FOR UPDATE
  TO service_role
  USING (true);

-- Allow service role to read all queue entries (for matchmaking)
CREATE POLICY "Service role can view all queue entries"
  ON queue_ranked FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to delete queue entries (when matched)
CREATE POLICY "Service role can delete queue entries"
  ON queue_ranked FOR DELETE
  TO service_role
  USING (true);

-- Allow service role to insert runs (for opponent)
CREATE POLICY "Service role can insert runs"
  ON runs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to insert routes
CREATE POLICY "Service role can insert routes"
  ON routes FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ===========================================
-- 6. Grant permissions
-- ===========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON queue_ranked TO service_role;
GRANT SELECT, INSERT, UPDATE ON matches TO service_role;
GRANT SELECT, INSERT ON runs TO service_role;
GRANT SELECT, INSERT ON routes TO service_role;

-- ===========================================
-- Done! The matchmaking system is now ready.
-- ===========================================
