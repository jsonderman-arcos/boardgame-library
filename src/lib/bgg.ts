import { supabase } from './supabase';

/**
 * BGG API client that calls our secure Edge Function
 * This keeps the BGG API token server-side only
 */

export interface BggGameData {
  name: string;
  year?: number;
  cover_image?: string;
  publisher?: string;
  min_players?: number;
  max_players?: number;
  playtime_minutes?: number;
  min_age?: number;
  game_type?: string[];
  game_category?: string[];
  game_mechanic?: string[];
  game_family?: string[];
  description?: string;
}

export interface BggSearchResult {
  bgg_id: number;
  name: string;
  year: number;
}

/**
 * Look up game details by BGG ID
 */
export async function lookupBggGame(bggId: number): Promise<BggGameData> {
  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId },
  });

  if (error) {
    console.error('BGG lookup error:', error);
    throw new Error(`Failed to lookup BGG game: ${error.message}`);
  }

  return data as BggGameData;
}

/**
 * Search for games by name
 */
export async function searchBggGames(searchName: string): Promise<BggSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { searchName },
  });

  if (error) {
    console.error('BGG search error:', error);
    throw new Error(`Failed to search BGG: ${error.message}`);
  }

  return data.results || [];
}

/**
 * Submit a new barcode to BGG ID mapping to GameUPC
 * This helps improve the GameUPC database for future lookups
 */
export async function submitBarcodeToGameUpc(barcode: string, bggId: number): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('submit-barcode-mapping', {
      body: { barcode, bggId },
    });

    if (error) {
      console.error('Failed to submit barcode mapping to GameUPC:', error);
      // Don't throw - this is a best-effort operation
    } else {
      console.log(`Successfully submitted barcode ${barcode} -> BGG ID ${bggId} to GameUPC`);
    }
  } catch (error) {
    console.error('Error submitting barcode mapping:', error);
    // Don't throw - this is a best-effort operation
  }
}

/**
 * Enhanced barcode lookup that combines barcode services and BGG data
 * 1. Look up barcode in secure edge function (tries GameUPC, falls back to BarcodeLookup)
 * 2. If title exists, search BGG by title to find matching game
 * 3. Use BGG ID from search results to fetch full game details
 */
export async function lookupBarcodeWithBgg(barcode: string): Promise<Partial<BggGameData> & { barcode: string; bgg_id?: number; source?: string }> {
  try {
    // Step 1: Lookup barcode using secure edge function
    const { data, error } = await supabase.functions.invoke('barcode-lookup', {
      body: { barcode },
    });

    if (error) {
      console.error('Barcode lookup error:', error);
      throw new Error('Barcode lookup failed');
    }

    const result = data;
    const gameTitle = result.name;
    const bggId = result.bgg_id;
    const source = result.source; // 'gameupc', 'barcodelookup', or 'upcitemdb'

    if (!gameTitle || gameTitle === 'Unknown Game') {
      console.warn('Barcode lookup returned no valid game title');
      return {
        barcode,
        name: 'Unknown Game',
        source,
      };
    }

    console.log(`Found game title from ${source}: ${gameTitle}`);

    // If we already have a BGG ID from GameUPC, use it directly
    if (bggId) {
      try {
        const bggData = await lookupBggGame(bggId);
        return {
          barcode,
          bgg_id: bggId,
          source,
          ...bggData,
        };
      } catch (bggError) {
        console.error('BGG lookup by ID failed, falling back to search:', bggError);
        // Fall through to search by name
      }
    }

    // Step 2: Search BGG by title to find the game
    try {
      const bggSearchResults = await searchBggGames(gameTitle);

      if (bggSearchResults.length === 0) {
        console.warn(`No BGG results found for title: ${gameTitle}`);
        // Fallback to barcode service data only
        return {
          barcode,
          bgg_id: bggId || undefined,
          name: gameTitle,
          source,
        };
      }

      // Use the first (best) match from BGG search
      const bestMatch = bggSearchResults[0];
      console.log(`Found BGG match: ${bestMatch.name} (ID: ${bestMatch.bgg_id})`);

      // Step 3: Fetch full details from BGG using the BGG ID
      try {
        const bggData = await lookupBggGame(bestMatch.bgg_id);
        return {
          barcode,
          bgg_id: bestMatch.bgg_id,
          source,
          ...bggData,
        };
      } catch (bggError) {
        console.error('BGG lookup failed, using search result data:', bggError);
        // Fallback to search result data
        return {
          barcode,
          bgg_id: bestMatch.bgg_id,
          name: bestMatch.name,
          year: bestMatch.year,
          source,
        };
      }
    } catch (searchError) {
      console.error('BGG search failed, using barcode service data only:', searchError);
      // Fallback to just barcode service data
      return {
        barcode,
        bgg_id: bggId || undefined,
        name: gameTitle,
        source,
      };
    }
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return {
      barcode,
      name: 'Unknown Game',
    };
  }
}
