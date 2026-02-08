/**
 * Script to enrich all shared_games entries with BGG data
 *
 * This script will:
 * 1. Fetch all games from shared_games table
 * 2. For each game:
 *    - If has bgg_id: fetch BGG details and update
 *    - If has barcode but no bgg_id: lookup barcode -> get bgg_id -> fetch details
 *    - If has name only: search BGG by name -> get best match
 * 3. Update only existing fields in the table (no new columns)
 *
 * Usage: tsx scripts/enrich-games-with-bgg.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Game } from '../src/lib/supabase';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BggGameData {
  name: string;
  year?: number;
  cover_image?: string;
  publisher?: string;
  min_players?: number;
  max_players?: number;
  playtime_minutes?: number;
  game_type?: string[];
  game_category?: string[];
  game_mechanic?: string[];
  game_family?: string[];
}

interface BggSearchResult {
  bgg_id: number;
  name: string;
  year: number;
}

async function lookupBggGame(bggId: number): Promise<BggGameData> {
  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId },
  });

  if (error) {
    throw new Error(`Failed to lookup BGG game ${bggId}: ${error.message}`);
  }

  return data as BggGameData;
}

async function searchBggGames(searchName: string): Promise<BggSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { searchName },
  });

  if (error) {
    throw new Error(`Failed to search BGG for "${searchName}": ${error.message}`);
  }

  return data.results || [];
}

async function lookupBarcode(barcode: string): Promise<{ bgg_id?: number; name?: string }> {
  const { data, error } = await supabase.functions.invoke('barcode-lookup', {
    body: { barcode },
  });

  if (error) {
    console.warn(`Barcode lookup failed for ${barcode}:`, error.message);
    return {};
  }

  return {
    bgg_id: data.bgg_id,
    name: data.name,
  };
}

async function enrichGame(game: Game): Promise<Partial<Game> | null> {
  console.log(`\nProcessing: ${game.name} (ID: ${game.id})`);

  let bggId = game.bgg_id;
  let bggData: BggGameData | null = null;

  // Step 1: Try to get BGG ID if we don't have it
  if (!bggId) {
    // Try barcode lookup first
    if (game.barcode) {
      console.log(`  Looking up barcode: ${game.barcode}`);
      try {
        const barcodeResult = await lookupBarcode(game.barcode);
        if (barcodeResult.bgg_id) {
          bggId = barcodeResult.bgg_id;
          console.log(`  Found BGG ID from barcode: ${bggId}`);
        }
      } catch (error) {
        console.warn(`  Barcode lookup failed:`, error);
      }
    }

    // If still no BGG ID, try searching by name
    if (!bggId) {
      console.log(`  Searching BGG for: ${game.name}`);
      try {
        const searchResults = await searchBggGames(game.name);
        if (searchResults.length > 0) {
          bggId = searchResults[0].bgg_id;
          console.log(`  Found BGG ID from search: ${bggId} (${searchResults[0].name})`);
        } else {
          console.log(`  No BGG results found for "${game.name}"`);
          return null;
        }
      } catch (error) {
        console.warn(`  BGG search failed:`, error);
        return null;
      }
    }
  }

  // Step 2: Fetch full BGG data
  if (bggId) {
    console.log(`  Fetching BGG details for ID: ${bggId}`);
    try {
      bggData = await lookupBggGame(bggId);
      console.log(`  Successfully fetched BGG data`);
    } catch (error) {
      console.warn(`  Failed to fetch BGG data:`, error);
      return null;
    }
  }

  if (!bggData) {
    return null;
  }

  // Step 3: Build update object with only existing fields
  const updates: Partial<Game> = {
    bgg_id: bggId,
  };

  // Only update fields that have values from BGG
  if (bggData.name) updates.name = bggData.name;
  if (bggData.publisher) updates.publisher = bggData.publisher;
  if (bggData.year) updates.year = bggData.year.toString();
  if (bggData.cover_image) updates.cover_image = bggData.cover_image;
  if (bggData.min_players !== undefined) updates.min_players = bggData.min_players;
  if (bggData.max_players !== undefined) updates.max_players = bggData.max_players;
  if (bggData.playtime_minutes !== undefined) updates.playtime_minutes = bggData.playtime_minutes;
  if (bggData.game_type && bggData.game_type.length > 0) updates.game_type = bggData.game_type;
  if (bggData.game_category && bggData.game_category.length > 0) updates.game_category = bggData.game_category;
  if (bggData.game_mechanic && bggData.game_mechanic.length > 0) updates.game_mechanic = bggData.game_mechanic;
  if (bggData.game_family && bggData.game_family.length > 0) updates.game_family = bggData.game_family;

  console.log(`  Will update ${Object.keys(updates).length} fields`);
  return updates;
}

async function main() {
  console.log('Starting BGG enrichment process...\n');

  // Fetch all games from shared_games
  const { data: games, error } = await supabase
    .from('shared_games')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch games:', error);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log('No games found in shared_games table');
    return;
  }

  console.log(`Found ${games.length} games to process\n`);
  console.log('=' .repeat(60));

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < games.length; i++) {
    const game = games[i] as Game;
    console.log(`\n[${i + 1}/${games.length}]`);

    try {
      // Add delay to avoid rate limiting (BGG API can be strict)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between requests
      }

      const updates = await enrichGame(game);

      if (!updates) {
        console.log(`  Skipped - no BGG data found`);
        skipCount++;
        continue;
      }

      // Update the game in the database
      const { error: updateError } = await supabase
        .from('shared_games')
        .update(updates)
        .eq('id', game.id);

      if (updateError) {
        console.error(`  Failed to update game:`, updateError);
        errorCount++;
      } else {
        console.log(`  ✓ Successfully updated`);
        successCount++;
      }
    } catch (error) {
      console.error(`  Error processing game:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nEnrichment complete!');
  console.log(`  Successfully updated: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${games.length}`);
}

main().catch(console.error);
