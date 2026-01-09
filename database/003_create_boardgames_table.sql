-- Drop old triggers and functions first (clean slate)
DROP TRIGGER IF EXISTS update_boardgames_timestamp ON boardgames;
DROP FUNCTION IF EXISTS update_boardgames_updated_at();

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default studio profile
INSERT INTO profiles (id, email, username, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'studio@blue148.com',
  'studio',
  '$2a$10$defaulthashfordemopurposes' -- Placeholder hash, update via app settings
)
ON CONFLICT (email) DO NOTHING;

-- Sync existing Supabase Auth users to profiles table
-- This will automatically add any existing authenticated users (like sonderman)
INSERT INTO profiles (id, email, username, password_hash)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username,
  '$2a$10$syncedfromsupabaseauth' as password_hash
FROM auth.users
ON CONFLICT (email) DO UPDATE SET
  username = COALESCE(EXCLUDED.username, profiles.username),
  id = EXCLUDED.id;

-- Add new columns to existing boardgames table (keep existing 'value' column)
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_type TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_category TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_mechanism TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS game_family TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS personal_ranking TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS played_dates TEXT[] DEFAULT '{}';
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE boardgames ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boardgames_user_id ON boardgames(user_id);
CREATE INDEX IF NOT EXISTS idx_boardgames_barcode ON boardgames(barcode);
CREATE INDEX IF NOT EXISTS idx_boardgames_name ON boardgames(name);
CREATE INDEX IF NOT EXISTS idx_boardgames_user_barcode ON boardgames(user_id, barcode);

-- Trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_boardgames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boardgames_timestamp
  BEFORE UPDATE ON boardgames
  FOR EACH ROW
  EXECUTE FUNCTION update_boardgames_updated_at();

COMMENT ON TABLE boardgames IS 'Unified table storing all board games with user-specific settings';
COMMENT ON COLUMN boardgames.name IS 'Game name from barcode lookup';
COMMENT ON COLUMN boardgames.year IS 'Publication year';
COMMENT ON COLUMN boardgames.barcode IS 'UPC/EAN barcode';
COMMENT ON COLUMN boardgames.publisher IS 'Publisher name from barcode lookup';
COMMENT ON COLUMN boardgames.cover_image IS 'Cover image URL from barcode lookup';