import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function updateSailBarcode() {
  // First, find the game with the old barcode
  console.log('Searching for game with barcode 618149323340...\n');

  const { data: games, error: searchError } = await supabase
    .from('shared_games')
    .select('*')
    .eq('barcode', '618149323340');

  if (searchError) {
    console.error('Error searching for game:', searchError);
    return;
  }

  console.log('Found games:', games);
  console.log('\n');

  if (!games || games.length === 0) {
    console.log('No game found with that barcode. Let me search for "Sail" or similar titles...\n');

    const { data: sailGames, error: sailError } = await supabase
      .from('shared_games')
      .select('*')
      .ilike('name', '%sail%');

    if (sailError) {
      console.error('Error searching for Sail:', sailError);
      return;
    }

    console.log('Games with "Sail" in name:', sailGames);

    if (!sailGames || sailGames.length === 0) {
      console.log('No games found with "Sail" in name either.');
      return;
    }

    // Update the first matching game
    const gameToUpdate = sailGames[0];
    console.log('\nUpdating game:', gameToUpdate.id, gameToUpdate.name);

    await updateGame(gameToUpdate.id);
  } else {
    // Update the found game
    const gameToUpdate = games[0];
    console.log('Updating game:', gameToUpdate.id, gameToUpdate.name);

    await updateGame(gameToUpdate.id);
  }
}

async function updateGame(gameId: string) {
  // Update the barcode and title
  const newBarcode = '0618149323340';
  const newTitle = 'Sail';

  console.log(`\nUpdating game ${gameId}:`);
  console.log(`- Setting barcode to: ${newBarcode}`);
  console.log(`- Setting name to: ${newTitle}`);

  const { data: updateData, error: updateError } = await supabase
    .from('shared_games')
    .update({
      barcode: newBarcode,
      name: newTitle
    })
    .eq('id', gameId)
    .select();

  if (updateError) {
    console.error('Error updating game:', updateError);
    return;
  }

  console.log('Updated game:', updateData);

  // Now do the BGG lookup for the correct Sail game (BGG ID: 377470)
  console.log('\nFetching BGG details for "Sail" (BGG ID: 377470)...\n');

  const correctBggId = 377470;

  const { data: gameDetails, error: detailsError } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId: correctBggId },
  });

  if (detailsError) {
    console.error('Error fetching game details:', detailsError);
    return;
  }

  console.log('Full Game Details:');
  console.log(JSON.stringify(gameDetails, null, 2));

  // Update the game with BGG data
  console.log('\n\nUpdating game with BGG data...');

  const { data: finalUpdate, error: finalError } = await supabase
    .from('shared_games')
    .update({
      bgg_id: correctBggId,
      name: gameDetails.name,
      year: gameDetails.year ? gameDetails.year.toString() : null,
      publisher: gameDetails.publisher,
      min_players: gameDetails.min_players,
      max_players: gameDetails.max_players,
      playtime_minutes: gameDetails.playtime_minutes,
      cover_image: gameDetails.cover_image,
      game_category: gameDetails.game_category,
      game_mechanic: gameDetails.game_mechanic,
      game_type: gameDetails.game_type,
      game_family: gameDetails.game_family,
    })
    .eq('id', gameId)
    .select();

  if (finalError) {
    console.error('Error updating game with BGG data:', finalError);
    return;
  }

  console.log('\nFinal updated game:');
  console.log(JSON.stringify(finalUpdate, null, 2));
}

updateSailBarcode();
