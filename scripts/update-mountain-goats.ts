import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function updateGame() {
  const gameId = 'ca78fe43-11d3-400a-a7e4-531cf0612232';
  const newBggId = 63975;

  console.log('Fetching BGG data for ID 63975...\n');

  // Fetch the correct game data from BGG
  const { data: bggData, error: bggError } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId: newBggId },
  });

  if (bggError) {
    console.error('Error fetching BGG data:', bggError);
    return;
  }

  console.log('Game found:', bggData.name);
  console.log('Year:', bggData.year);
  console.log('Publisher:', bggData.publisher);
  console.log('Players:', `${bggData.min_players}-${bggData.max_players}`);
  console.log('Playtime:', bggData.playtime_minutes, 'minutes');

  console.log('\nUpdating database entry...');

  // Update the database entry
  const { data: updatedGame, error: updateError } = await supabase
    .from('shared_games')
    .update({
      bgg_id: newBggId,
      name: bggData.name,
      publisher: bggData.publisher,
      year: bggData.year?.toString(),
      cover_image: bggData.cover_image,
      min_players: bggData.min_players,
      max_players: bggData.max_players,
      playtime_minutes: bggData.playtime_minutes,
      game_type: bggData.game_type,
      game_category: bggData.game_category,
      game_mechanic: bggData.game_mechanic,
      game_family: bggData.game_family,
    })
    .eq('id', gameId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating game:', updateError);
    return;
  }

  console.log('\n✓ Successfully updated!');
  console.log('\nUpdated game details:');
  console.log('Name:', updatedGame.name);
  console.log('BGG ID:', updatedGame.bgg_id);
  console.log('Publisher:', updatedGame.publisher);
  console.log('Year:', updatedGame.year);
}

updateGame().catch(console.error);
