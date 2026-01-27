import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// For React Native, you'll need to set these environment variables
// Create a .env file in the mobile directory with:
// EXPO_PUBLIC_SUPABASE_URL=your_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: require('@react-native-async-storage/async-storage').default,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface Game {
  id: string;
  barcode: string;
  name: string;
  publisher?: string;
  year?: string;
  edition?: string;
  cover_image?: string;
  game_type?: string[];
  game_category?: string[];
  game_mechanism?: string[];
  game_family?: string[];
  min_players?: number;
  max_players?: number;
  playtime_minutes?: number;
  is_expansion?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLibraryEntry {
  id: string;
  user_id: string;
  game_id: string;
  is_favorite: boolean;
  for_sale: boolean;
  personal_ranking?: 'high' | 'medium' | 'low';
  played_dates?: string[];
  notes?: string;
  added_date: string;
  updated_at: string;
  game?: Game;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications_enabled: boolean;
    default_view: 'grid' | 'list';
  };
  total_games: number;
  favorite_count: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
