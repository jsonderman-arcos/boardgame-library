/*
  # Add Game Details Fields to Shared Games

  1. Changes
    - Add `min_players` (integer) - minimum number of players
    - Add `max_players` (integer) - maximum number of players  
    - Add `playtime_minutes` (integer) - estimated playtime in minutes
    - Add `is_expansion` (boolean) - whether the game is an expansion
  
  2. Notes
    - All fields are nullable to support existing records
    - Default value for is_expansion is false
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shared_games' AND column_name = 'min_players'
  ) THEN
    ALTER TABLE shared_games ADD COLUMN min_players integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shared_games' AND column_name = 'max_players'
  ) THEN
    ALTER TABLE shared_games ADD COLUMN max_players integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shared_games' AND column_name = 'playtime_minutes'
  ) THEN
    ALTER TABLE shared_games ADD COLUMN playtime_minutes integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shared_games' AND column_name = 'is_expansion'
  ) THEN
    ALTER TABLE shared_games ADD COLUMN is_expansion boolean DEFAULT false;
  END IF;
END $$;