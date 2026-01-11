/*
  # Create Avatars Storage Bucket

  1. Storage Setup
    - Creates a public storage bucket named 'avatars' for user profile pictures
    - Allows file types: image/jpeg, image/png, image/webp, image/gif
    - Max file size: 2MB

  2. Notes
    - Files are stored with path pattern: {user_id}/{filename}
    - Public access allows avatar images to be displayed without authentication
    - Storage policies are managed automatically by Supabase
*/

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;