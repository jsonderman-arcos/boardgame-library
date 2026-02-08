import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkGameData() {
  const { data, error } = await supabase
    .from('shared_games')
    .select('name, game_type, game_family, game_category, game_mechanic')
    .eq('name', 'Wingspan')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Game:', data.name);
  console.log('game_type:', data.game_type);
  console.log('game_family:', data.game_family);
  console.log('game_category:', data.game_category);
  console.log('game_mechanic:', data.game_mechanic);
}

checkGameData();
