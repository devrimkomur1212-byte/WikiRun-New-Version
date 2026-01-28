-- WikiRun Database Schema
-- Run this in your Supabase SQL editor

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  country TEXT,
  elo_rating INTEGER DEFAULT 1000,
  games_played_ranked INTEGER DEFAULT 0,
  is_pro BOOLEAN DEFAULT FALSE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

-- Routes table (predefined Start/Target pairs)
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_title TEXT NOT NULL,
  target_title TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table (sync PvP pairs with real-time matchmaking)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) NOT NULL,
  player1_id UUID REFERENCES profiles(id) NOT NULL,
  player2_id UUID REFERENCES profiles(id) NOT NULL,
  player1_run_id UUID,
  player2_run_id UUID,
  status TEXT CHECK (status IN ('queued', 'pending', 'complete', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  winner_id UUID REFERENCES profiles(id),
  elo_delta_p1 INTEGER,
  elo_delta_p2 INTEGER,
  start_time TIMESTAMPTZ  -- For synchronized match start countdown
);

-- Runs table (individual run attempts)
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  mode TEXT CHECK (mode IN ('ranked', 'training')) NOT NULL,
  route_id UUID REFERENCES routes(id),
  match_id UUID REFERENCES matches(id),
  start_title TEXT NOT NULL,
  target_title TEXT NOT NULL,
  active_time_ms INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  misses_count INTEGER DEFAULT 0,
  route_titles JSONB DEFAULT '[]'::jsonb,
  step_data JSONB DEFAULT '[]'::jsonb,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for match runs after runs table exists
ALTER TABLE matches ADD CONSTRAINT fk_player1_run FOREIGN KEY (player1_run_id) REFERENCES runs(id);
ALTER TABLE matches ADD CONSTRAINT fk_player2_run FOREIGN KEY (player2_run_id) REFERENCES runs(id);

-- Achievements definitions
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB NOT NULL
);

-- User achievements (unlocks)
CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  achievement_id TEXT REFERENCES achievements(id) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Ranked queue (ELO-based matchmaking)
CREATE TABLE queue_ranked (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),  -- Nullable, set when matched
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  elo_rating INTEGER DEFAULT 1000  -- For ELO-based matching
);

-- Indexes for performance
CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_runs_mode ON runs(mode);
CREATE INDEX idx_runs_is_completed ON runs(is_completed);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_profiles_elo ON profiles(elo_rating DESC);
CREATE INDEX idx_queue_ranked_route ON queue_ranked(route_id);
CREATE INDEX idx_queue_ranked_elo ON queue_ranked(elo_rating);
CREATE INDEX idx_queue_ranked_queued_at ON queue_ranked(queued_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_ranked ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: public read, own write
CREATE POLICY "Public profiles viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Routes: public read
CREATE POLICY "Routes viewable by everyone"
  ON routes FOR SELECT
  USING (true);

-- Runs: own read/write
CREATE POLICY "Users can view own runs"
  ON runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own runs"
  ON runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own runs"
  ON runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Matches: participants can view
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Achievements: public read
CREATE POLICY "Everyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- User achievements: own read, service role insert
CREATE POLICY "Users can view own unlocked achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Queue: own read/write
CREATE POLICY "Users can view own queue entry"
  ON queue_ranked FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue entry"
  ON queue_ranked FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue entry"
  ON queue_ranked FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- Service Role Policies (for matchmaking)
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
-- Enable Supabase Realtime on matches table
-- (Run this separately if it fails - some Supabase versions handle this differently)
-- ===========================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE matches;
