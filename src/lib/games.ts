import { supabase, Game, UserLibraryEntry } from './supabase';

export async function getUserLibrary(userId: string) {
  const { data, error } = await supabase
    .from('user_library')
    .select(`
      *,
      game:shared_games(*)
    `)
    .eq('user_id', userId)
    .order('added_date', { ascending: false });

  if (error) throw error;
  return data as (UserLibraryEntry & { game: Game })[];
}

export async function getLibraryEntry(entryId: string) {
  const { data, error } = await supabase
    .from('user_library')
    .select(`
      *,
      game:shared_games(*)
    `)
    .eq('id', entryId)
    .single();

  if (error) throw error;
  return data as UserLibraryEntry & { game: Game };
}

export async function searchSharedGames(query: string) {
  const { data, error } = await supabase
    .from('shared_games')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data as Game[];
}

export async function getGameByBarcode(barcode: string) {
  const { data, error } = await supabase
    .from('shared_games')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();

  if (error) throw error;
  return data as Game | null;
}

export async function createSharedGame(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('shared_games')
    .insert(game)
    .select()
    .single();

  if (error) throw error;
  return data as Game;
}

export async function addGameToLibrary(userId: string, gameId: string) {
  const { data, error } = await supabase
    .from('user_library')
    .insert({
      user_id: userId,
      game_id: gameId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserLibraryEntry;
}

export async function updateLibraryEntry(
  entryId: string,
  updates: Partial<Pick<UserLibraryEntry, 'is_favorite' | 'for_sale' | 'personal_ranking' | 'played_dates' | 'notes'>>
) {
  const { data, error } = await supabase
    .from('user_library')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data as UserLibraryEntry;
}

export async function removeGameFromLibrary(entryId: string) {
  const { error } = await supabase
    .from('user_library')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

export async function lookupBarcode(barcode: string): Promise<Partial<Game>> {
  try {
    const response = await fetch(`https://api.gameupc.com/test/upc/${barcode}`, {
      headers: {
        'x-api-key': 'test_test_test_test_test'
      }
    });

    if (!response.ok) {
      throw new Error('Barcode lookup failed');
    }

    const result = await response.json();

    // GameUPC returns bgg_info array with game matches
    if (result.bgg_info && result.bgg_info.length > 0) {
      const game = result.bgg_info[0];
      return {
        barcode,
        name: game.name || 'Unknown Game',
        bgg_id: game.id,
        // GameUPC primarily provides BGG mapping - additional metadata like
        // publisher, year, and cover_image would need to be fetched from BGG API
      };
    }

    return {
      barcode,
      name: 'Unknown Game',
    };
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return {
      barcode,
      name: 'Unknown Game',
    };
  }
}

export async function enrichSharedGameWithBggId(barcode: string): Promise<Game | null> {
  // First, get the existing game by barcode
  const existingGame = await getGameByBarcode(barcode);

  if (!existingGame) {
    return null;
  }

  // If bgg_id is already set, return the game as-is
  if (existingGame.bgg_id) {
    return existingGame;
  }

  // Look up the barcode using GameUPC API
  const gameData = await lookupBarcode(barcode);

  // If we got a bgg_id from the API, update the shared_games record
  if (gameData.bgg_id) {
    const { data, error } = await supabase
      .from('shared_games')
      .update({ bgg_id: gameData.bgg_id })
      .eq('id', existingGame.id)
      .select()
      .single();

    if (error) throw error;
    return data as Game;
  }

  // No bgg_id found, return the existing game
  return existingGame;
}
