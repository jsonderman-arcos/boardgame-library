import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function updateCascadiaBarcode() {
  // First, find the game with the old barcode
  console.log('Searching for game with barcode 729220070982...\n');

  const { data: games, error: searchError } = await supabase
    .from('shared_games')
    .select('*')
    .eq('barcode', '729220070982');

  if (searchError) {
    console.error('Error searching for game:', searchError);
    return;
  }

  console.log('Found games:', games);
  console.log('\n');

  if (!games || games.length === 0) {
    console.log('No game found with that barcode. Let me search for "Cascadia" or similar titles...\n');

    const { data: cascadiaGames, error: cascadiaError } = await supabase
      .from('shared_games')
      .select('*')
      .ilike('name', '%cascadia%');

    if (cascadiaError) {
      console.error('Error searching for Cascadia:', cascadiaError);
      return;
    }

    console.log('Games with "Cascadia" in name:', cascadiaGames);

    if (!cascadiaGames || cascadiaGames.length === 0) {
      console.log('No games found with "Cascadia" in name either.');
      return;
    }

    // Update the first matching game
    const gameToUpdate = cascadiaGames[0];
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
  // Update the barcode and name
  const newBarcode = '0729220070982';
  const newName = 'Cascadia';

  console.log(`\nUpdating game ${gameId}:`);
  console.log(`- Setting barcode to: ${newBarcode}`);
  console.log(`- Setting name to: ${newName}`);

  const { data: updateData, error: updateError } = await supabase
    .from('shared_games')
    .update({
      barcode: newBarcode,
      name: newName
    })
    .eq('id', gameId)
    .select();

  if (updateError) {
    console.error('Error updating game:', updateError);
    return;
  }

  console.log('Updated game:', updateData);

  // Search for Cascadia on BGG to find the correct ID
  console.log('\nSearching BGG for "Cascadia"...\n');

  const { data: searchResults, error: searchError } = await supabase.functions.invoke('bgg-lookup', {
    body: { searchName: 'Cascadia' },
  });

  if (searchError) {
    console.error('Error searching BGG:', searchError);
    return;
  }

  console.log('BGG Search Results:');
  console.log(JSON.stringify(searchResults, null, 2));

  if (searchResults.results && searchResults.results.length > 0) {
    // Find the main Cascadia game (not expansions)
    const mainGame = searchResults.results.find((game: any) =>
      game.name === 'Cascadia' && !game.name.includes(':')
    ) || searchResults.results[0];

    console.log('\n\nUsing game:', mainGame.name, '(', mainGame.year, ') - BGG ID:', mainGame.bgg_id);

    // Get full details for the game
    console.log('\nFetching full details...\n');

    const { data: gameDetails, error: detailsError } = await supabase.functions.invoke('bgg-lookup', {
      body: { bggId: mainGame.bgg_id },
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
        bgg_id: mainGame.bgg_id,
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
}

updateCascadiaBarcode();
