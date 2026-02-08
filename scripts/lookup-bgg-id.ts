import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function lookupBggId(bggId: number) {
  // First check if it's in our database
  const { data: dbGame, error: dbError } = await supabase
    .from('shared_games')
    .select('*')
    .eq('bgg_id', bggId)
    .single();

  if (dbGame) {
    console.log('Found in database:');
    console.log('Name:', dbGame.name);
    console.log('BGG ID:', dbGame.bgg_id);
    console.log('Publisher:', dbGame.publisher);
    console.log('Year:', dbGame.year);
    return;
  }

  // If not in database, fetch from BGG
  console.log('Not in database, fetching from BGG...\n');

  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId },
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('BGG Game Details:');
  console.log('Name:', data.name);
  console.log('Year:', data.year);
  console.log('Publisher:', data.publisher);
  console.log('Players:', `${data.min_players}-${data.max_players}`);
  console.log('Playtime:', data.playtime_minutes, 'minutes');
  console.log('Categories:', data.game_category);
}

lookupBggId(305985);
