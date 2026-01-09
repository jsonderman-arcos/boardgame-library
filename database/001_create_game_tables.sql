-- =====================================================
-- Board Game Library - Optimized Relational Schema
-- =====================================================

-- Table 1: Shared Games (global game database)
-- Stores core game information shared across all users
CREATE TABLE IF NOT EXISTS shared_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  publisher TEXT,
  year TEXT,
  edition TEXT,
  cover_image TEXT,
  game_type TEXT[] DEFAULT '{}',
  game_category TEXT[] DEFAULT '{}',
  game_mechanism TEXT[] DEFAULT '{}',
  game_family TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: User Library (personal game collections)
-- Stores user-specific settings and associations
CREATE TABLE IF NOT EXISTS user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES shared_games(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  for_sale BOOLEAN DEFAULT FALSE,
  personal_ranking TEXT,
  played_dates TEXT[] DEFAULT '{}',
  notes TEXT,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_shared_games_barcode ON shared_games(barcode);
CREATE INDEX IF NOT EXISTS idx_shared_games_name ON shared_games(name);
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_game_id ON user_library(game_id);
CREATE INDEX IF NOT EXISTS idx_user_library_is_favorite ON user_library(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_library_for_sale ON user_library(for_sale);

-- Full-text search index for game names
CREATE INDEX IF NOT EXISTS idx_shared_games_name_trgm ON shared_games USING gin(name gin_trgm_ops);

-- Enable pg_trgm extension for fuzzy search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_shared_games_updated_at ON shared_games;
CREATE TRIGGER update_shared_games_updated_at
  BEFORE UPDATE ON shared_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_library_updated_at ON user_library;
CREATE TRIGGER update_user_library_updated_at
  BEFORE UPDATE ON user_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE shared_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

-- Shared games are readable by everyone (for barcode lookups)
DROP POLICY IF EXISTS "Shared games are viewable by everyone" ON shared_games;
CREATE POLICY "Shared games are viewable by everyone"
  ON shared_games FOR SELECT
  USING (true);

-- Shared games can be created by anyone (when scanning new barcodes)
DROP POLICY IF EXISTS "Shared games can be created by anyone" ON shared_games;
CREATE POLICY "Shared games can be created by anyone"
  ON shared_games FOR INSERT
  WITH CHECK (true);

-- Shared games can be updated by anyone (crowdsourced data improvement)
DROP POLICY IF EXISTS "Shared games can be updated by anyone" ON shared_games;
CREATE POLICY "Shared games can be updated by anyone"
  ON shared_games FOR UPDATE
  USING (true);

-- Users can only see their own library entries
DROP POLICY IF EXISTS "Users can view own library" ON user_library;
CREATE POLICY "Users can view own library"
  ON user_library FOR SELECT
  USING (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only insert into their own library
DROP POLICY IF EXISTS "Users can insert own library" ON user_library;
CREATE POLICY "Users can insert own library"
  ON user_library FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only update their own library entries
DROP POLICY IF EXISTS "Users can update own library" ON user_library;
CREATE POLICY "Users can update own library"
  ON user_library FOR UPDATE
  USING (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only delete their own library entries
DROP POLICY IF EXISTS "Users can delete own library" ON user_library;
CREATE POLICY "Users can delete own library"
  ON user_library FOR DELETE
  USING (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Comments for documentation
COMMENT ON TABLE shared_games IS 'Global database of board games, shared across all users';
COMMENT ON TABLE user_library IS 'User-specific game collections with personal settings';
COMMENT ON COLUMN shared_games.barcode IS 'UPC/EAN barcode - unique identifier for game lookup';
COMMENT ON COLUMN user_library.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN user_library.game_id IS 'Reference to shared_games.id';
COMMENT ON COLUMN user_library.is_favorite IS 'User marked this game as favorite';
COMMENT ON COLUMN user_library.for_sale IS 'User marked this game for sale';
COMMENT ON COLUMN user_library.personal_ranking IS 'User personal ranking: high, medium, low';
COMMENT ON COLUMN user_library.played_dates IS 'Array of ISO date strings when game was played';
