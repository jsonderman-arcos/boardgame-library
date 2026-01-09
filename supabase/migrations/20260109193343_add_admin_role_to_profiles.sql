/*
  # Add Admin Role to Profiles

  1. Changes
    - Add `is_admin` boolean column to profiles table
    - Set studio@blue148.com as admin user
    - Add RLS policies for admin users to manage shared_games
  
  2. Security
    - Only admins can insert, update, or delete shared_games
    - All authenticated users can read shared_games (existing policy)
    - Regular users cannot modify is_admin field
*/

-- Add is_admin column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Set studio@blue148.com as admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'studio@blue148.com';

-- Add RLS policies for admin users to manage shared_games

-- Admin users can insert shared_games
DROP POLICY IF EXISTS "Admins can insert shared games" ON shared_games;
CREATE POLICY "Admins can insert shared games"
  ON shared_games FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admin users can update shared_games
DROP POLICY IF EXISTS "Admins can update shared games" ON shared_games;
CREATE POLICY "Admins can update shared games"
  ON shared_games FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admin users can delete shared_games
DROP POLICY IF EXISTS "Admins can delete shared games" ON shared_games;
CREATE POLICY "Admins can delete shared games"
  ON shared_games FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Whether this user has admin privileges';
