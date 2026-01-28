-- WikiRun Seed Data
-- Run this after migrations.sql

-- Sample routes (Easy)
INSERT INTO routes (start_title, target_title, difficulty) VALUES
  ('Cat', 'Dog', 'easy'),
  ('United States', 'France', 'easy'),
  ('Apple', 'Orange', 'easy'),
  ('Football', 'Basketball', 'easy'),
  ('New York City', 'Los Angeles', 'easy'),
  ('Pizza', 'Hamburger', 'easy');

-- Sample routes (Medium)
INSERT INTO routes (start_title, target_title, difficulty) VALUES
  ('Apple Inc.', 'Microsoft', 'medium'),
  ('Physics', 'Philosophy', 'medium'),
  ('Albert Einstein', 'Isaac Newton', 'medium'),
  ('World War I', 'World War II', 'medium'),
  ('Python (programming language)', 'JavaScript', 'medium'),
  ('Moon', 'Mars', 'medium');

-- Sample routes (Hard)
INSERT INTO routes (start_title, target_title, difficulty) VALUES
  ('Ancient Rome', 'Modern art', 'hard'),
  ('Quantum mechanics', 'Classical music', 'hard'),
  ('DNA', 'Computer science', 'hard'),
  ('Renaissance', 'Industrial Revolution', 'hard'),
  ('Buddhism', 'Quantum physics', 'hard'),
  ('Platypus', 'Artificial intelligence', 'hard');

-- Achievements
INSERT INTO achievements (id, name, description, criteria) VALUES
  ('first_run', 'First Run', 'Complete your first run', '{"type": "run_count", "min": 1}'),
  ('first_ranked_win', 'First Ranked Win', 'Win your first ranked match', '{"type": "ranked_wins", "min": 1}'),
  ('sub_5_min', 'Speedrunner', 'Complete a run in under 5 minutes', '{"type": "time", "max_ms": 300000}'),
  ('sub_2_min', 'Speed Demon', 'Complete a run in under 2 minutes', '{"type": "time", "max_ms": 120000}'),
  ('sub_1_min', 'Lightning Fast', 'Complete a run in under 1 minute', '{"type": "time", "max_ms": 60000}'),
  ('click_efficient', 'Efficient Navigator', 'Complete a run with 10 or fewer clicks', '{"type": "clicks", "max": 10}'),
  ('marathon_trainer', 'Marathon Trainer', 'Complete 10 training runs', '{"type": "training_count", "min": 10}'),
  ('no_misses', 'Perfect Navigation', 'Complete a run with zero misses', '{"type": "misses", "max": 0}'),
  ('streak_3', 'On a Streak', 'Win 3 ranked matches in a row', '{"type": "win_streak", "min": 3}'),
  ('explorer', 'Explorer', 'Visit 50 unique articles across all runs', '{"type": "unique_articles", "min": 50}');
