/*
  # Add BoardGameGeek ID to Shared Games

  1. Changes
    - Add `bgg_id` (integer) - BoardGameGeek game ID from GameUPC API

  2. Notes
    - Field is nullable to support existing records
    - Can be used to fetch additional metadata from BGG API
    - Indexed for fast lookups
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shared_games' AND column_name = 'bgg_id'
  ) THEN
    ALTER TABLE shared_games ADD COLUMN bgg_id integer;
    CREATE INDEX IF NOT EXISTS idx_shared_games_bgg_id ON shared_games(bgg_id);
    COMMENT ON COLUMN shared_games.bgg_id IS 'BoardGameGeek ID - used for fetching additional metadata';
  END IF;
END $$;
