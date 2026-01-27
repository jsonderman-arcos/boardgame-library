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

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode === '23505' && game.barcode) {
      const existing = await getGameByBarcode(game.barcode);
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
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
    const apiKey = process.env.EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY;

    console.log('Barcode lookup started for:', barcode);
    console.log('API Key present:', !!apiKey);

    if (!apiKey) {
      console.error('Barcode lookup API key not configured');
      return {
        barcode,
        name: 'Unknown Game',
      };
    }

    const url = `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${apiKey}`;
    console.log('Fetching from barcode API...');

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Barcode API error response:', errorText);
      throw new Error(`Barcode lookup failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (result.products && result.products.length > 0) {
      const product = result.products[0];
      return {
        barcode,
        name: product.title || product.product_name || 'Unknown Game',
        publisher: product.brand || product.manufacturer,
        year: product.release_date?.split('-')[0],
        cover_image: product.images?.[0],
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
