-- =====================================================
-- User Profiles Table
-- =====================================================
-- This table stores user profile information and syncs with auth.users
-- Every authenticated user automatically gets a profile entry

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- App-specific settings
  preferences JSONB DEFAULT '{
    "theme": "light",
    "notifications_enabled": true,
    "default_view": "grid"
  }'::jsonb,
  
  -- Stats
  total_games INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for social features like seeing who owns what games)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can only insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can only delete their own profile
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Automatic profile creation trigger
-- When a user signs up via auth.users, automatically create their profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update game stats when library changes
CREATE OR REPLACE FUNCTION update_user_game_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for the affected user
  UPDATE profiles
  SET 
    total_games = (
      SELECT COUNT(*) 
      FROM user_library 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    favorite_count = (
      SELECT COUNT(*) 
      FROM user_library 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
        AND is_favorite = true
    )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update stats when library changes
DROP TRIGGER IF EXISTS update_stats_on_library_insert ON user_library;
CREATE TRIGGER update_stats_on_library_insert
  AFTER INSERT ON user_library
  FOR EACH ROW
  EXECUTE FUNCTION update_user_game_stats();

DROP TRIGGER IF EXISTS update_stats_on_library_update ON user_library;
CREATE TRIGGER update_stats_on_library_update
  AFTER UPDATE ON user_library
  FOR EACH ROW
  EXECUTE FUNCTION update_user_game_stats();

DROP TRIGGER IF EXISTS update_stats_on_library_delete ON user_library;
CREATE TRIGGER update_stats_on_library_delete
  AFTER DELETE ON user_library
  FOR EACH ROW
  EXECUTE FUNCTION update_user_game_stats();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with preferences and stats';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN profiles.email IS 'User email from auth.users';
COMMENT ON COLUMN profiles.username IS 'Unique username for display';
COMMENT ON COLUMN profiles.preferences IS 'JSON object with user preferences';
COMMENT ON COLUMN profiles.total_games IS 'Cached count of games in library';
COMMENT ON COLUMN profiles.favorite_count IS 'Cached count of favorited games';
