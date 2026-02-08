import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function fetchBggGame() {
  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId: 305985 },
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('BGG Game Details for ID 305985:\n');
  console.log('Name:', data.name);
  console.log('Year:', data.year);
  console.log('Publisher:', data.publisher);
  console.log('Players:', `${data.min_players}-${data.max_players}`);
  console.log('Playtime:', data.playtime_minutes, 'minutes');
  console.log('Min Age:', data.min_age);
  console.log('\nCategories:', data.game_category);
  console.log('\nMechanics:', data.game_mechanic);
}

fetchBggGame();
