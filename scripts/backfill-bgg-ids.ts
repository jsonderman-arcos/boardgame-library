#!/usr/bin/env tsx
/**
 * One-time migration script to backfill bgg_id for existing shared_games records
 *
 * This script:
 * 1. Fetches all shared_games records that have a barcode but no bgg_id
 * 2. Calls the GameUPC API for each barcode
 * 3. Updates the record with the returned bgg_id
 *
 * Usage: npm run backfill-bgg-ids
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

// Create Supabase client using process.env instead of import.meta.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Game interface
interface Game {
  id: string;
  barcode: string;
  name: string;
  bgg_id?: number;
  [key: string]: any;
}

// Lookup function copied from src/lib/games.ts to avoid import.meta.env issues
async function lookupBarcode(barcode: string): Promise<{ bgg_id?: number; name?: string }> {
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
        bgg_id: game.id,
        name: game.name || 'Unknown Game',
      };
    }

    return {
      name: 'Unknown Game',
    };
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return {
      name: 'Unknown Game',
    };
  }
}

async function backfillBggIds() {
  console.log('Starting bgg_id backfill process...\n');

  // Fetch all games with barcodes but no bgg_id
  const { data: games, error } = await supabase
    .from('shared_games')
    .select('*')
    .not('barcode', 'is', null)
    .is('bgg_id', null);

  if (error) {
    console.error('Error fetching games:', error);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log('No games found that need bgg_id backfill.');
    return;
  }

  console.log(`Found ${games.length} games to process.\n`);

  let successCount = 0;
  let failureCount = 0;
  let notFoundCount = 0;

  // Process each game with rate limiting to avoid overwhelming the API
  for (let i = 0; i < games.length; i++) {
    const game = games[i] as Game;
    console.log(`[${i + 1}/${games.length}] Processing: ${game.name} (barcode: ${game.barcode})`);

    try {
      // Look up the barcode using GameUPC API
      const gameData = await lookupBarcode(game.barcode);

      if (gameData.bgg_id) {
        // Update the shared_games record with the bgg_id
        const { error: updateError } = await supabase
          .from('shared_games')
          .update({ bgg_id: gameData.bgg_id })
          .eq('id', game.id);

        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
          failureCount++;
        } else {
          console.log(`  ✓ Updated with bgg_id: ${gameData.bgg_id}`);
          successCount++;
        }
      } else {
        console.log(`  ⚠ No bgg_id found for this barcode`);
        notFoundCount++;
      }

      // Rate limit: wait 500ms between requests to be respectful to the API
      if (i < games.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`  ❌ Error processing game:`, error);
      failureCount++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('Backfill Summary:');
  console.log('='.repeat(50));
  console.log(`Total games processed: ${games.length}`);
  console.log(`✓ Successfully updated: ${successCount}`);
  console.log(`⚠ No bgg_id found: ${notFoundCount}`);
  console.log(`❌ Failed to update: ${failureCount}`);
  console.log('='.repeat(50));
}

// Run the backfill
backfillBggIds()
  .then(() => {
    console.log('\nBackfill process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nBackfill process failed:', error);
    process.exit(1);
  });
