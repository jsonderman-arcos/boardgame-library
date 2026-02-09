/**
 * Test script to add a game to the database via barcode lookup
 * Follows the cascade: GameUPC -> BarcodeLookup -> UPCItemDB
 * Then enriches with BGG data and adds to database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const BARCODE = '3558380020400';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Game {
  id?: string;
  barcode: string;
  name: string;
  bgg_id?: number;
  publisher?: string;
  year?: string;
  edition?: string;
  cover_image?: string;
  game_type?: string[];
  game_category?: string[];
  game_mechanic?: string[];
  game_family?: string[];
  min_players?: number;
  max_players?: number;
  playtime_minutes?: number;
  is_expansion?: boolean;
}

async function main() {
  console.log('🎲 Adding game to database via barcode lookup');
  console.log('='.repeat(60));
  console.log(`Barcode: ${BARCODE}`);
  console.log('');

  try {
    // Step 1: Check if game already exists in shared_games
    console.log('Step 1: Checking if game already exists...');
    const { data: existingGame } = await supabase
      .from('shared_games')
      .select('*')
      .eq('barcode', BARCODE)
      .maybeSingle();

    if (existingGame) {
      console.log('✅ Game already exists in shared_games table:');
      console.log(`   ID: ${existingGame.id}`);
      console.log(`   Name: ${existingGame.name}`);
      console.log(`   BGG ID: ${existingGame.bgg_id || 'N/A'}`);
      console.log(`   Publisher: ${existingGame.publisher || 'N/A'}`);
      console.log('');

      // Still show option to add to user library
      console.log('💡 Game exists. To add to your library, you need a user ID.');
      console.log('   Run this script with: USER_ID=<your-uuid> npm run test:add-game');
      return;
    }

    console.log('Game not found in database. Proceeding with lookup...');
    console.log('');

    // Step 2: Call barcode-lookup edge function (follows cascade)
    console.log('Step 2: Looking up barcode via edge function...');
    console.log('   Cascade order: GameUPC → BarcodeLookup → UPCItemDB');
    console.log('');

    const { data: lookupData, error: lookupError } = await supabase.functions.invoke('barcode-lookup', {
      body: { barcode: BARCODE },
    });

    if (lookupError) {
      console.error('❌ Barcode lookup failed:', lookupError);
      throw new Error(`Barcode lookup failed: ${lookupError.message}`);
    }

    console.log('✅ Barcode lookup succeeded:');
    console.log(`   Source: ${lookupData.source}`);
    console.log(`   Name: ${lookupData.name}`);
    console.log(`   BGG ID: ${lookupData.bgg_id || 'Not provided by source'}`);
    console.log('');

    const gameTitle = lookupData.name;
    let bggId = lookupData.bgg_id;
    const source = lookupData.source;

    // Step 3: BGG enrichment
    console.log('Step 3: BGG enrichment...');
    let bggData: any = {};

    if (bggId) {
      // Direct BGG ID lookup
      console.log(`   Using BGG ID ${bggId} from ${source}`);
      const { data: bggResult, error: bggError } = await supabase.functions.invoke('bgg-lookup', {
        body: { bggId },
      });

      if (bggError) {
        console.warn('   ⚠️  BGG lookup failed:', bggError.message);
      } else {
        bggData = bggResult;
        console.log('   ✅ BGG data fetched successfully');
      }
    } else if (gameTitle && gameTitle !== 'Unknown Game') {
      // Search BGG by title
      console.log(`   Searching BGG for: "${gameTitle}"`);
      const { data: searchResult, error: searchError } = await supabase.functions.invoke('bgg-lookup', {
        body: { searchName: gameTitle },
      });

      if (searchError) {
        console.warn('   ⚠️  BGG search failed:', searchError.message);
      } else if (searchResult.results && searchResult.results.length > 0) {
        const bestMatch = searchResult.results[0];
        bggId = bestMatch.bgg_id;
        console.log(`   ✅ Found BGG match: ${bestMatch.name} (ID: ${bggId})`);

        // Fetch full details
        const { data: bggResult, error: bggError } = await supabase.functions.invoke('bgg-lookup', {
          body: { bggId },
        });

        if (bggError) {
          console.warn('   ⚠️  BGG detail fetch failed:', bggError.message);
        } else {
          bggData = bggResult;
          console.log('   ✅ BGG details fetched successfully');
        }
      } else {
        console.log('   ℹ️  No BGG results found');
      }
    }

    console.log('');

    // Step 4: Create game in shared_games table
    console.log('Step 4: Creating game in shared_games table...');

    const gameData: Omit<Game, 'id'> = {
      barcode: BARCODE,
      name: bggData.name || gameTitle || 'Unknown Game',
      bgg_id: bggId,
      publisher: bggData.publisher || lookupData.brand,
      year: bggData.year?.toString(),
      cover_image: bggData.cover_image,
      min_players: bggData.min_players,
      max_players: bggData.max_players,
      playtime_minutes: bggData.playtime_minutes,
      game_type: bggData.game_type,
      game_category: bggData.game_category,
      game_mechanic: bggData.game_mechanic,
      game_family: bggData.game_family,
    };

    const { data: newGame, error: insertError } = await supabase
      .from('shared_games')
      .insert(gameData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert game:', insertError);
      throw insertError;
    }

    console.log('✅ Game created successfully in shared_games!');
    console.log('');

    // Step 5: Display game details
    console.log('📋 Game Details:');
    console.log('─'.repeat(60));
    console.log(`   ID: ${newGame.id}`);
    console.log(`   Name: ${newGame.name}`);
    console.log(`   Barcode: ${newGame.barcode}`);
    console.log(`   BGG ID: ${newGame.bgg_id || 'N/A'}`);
    console.log(`   Publisher: ${newGame.publisher || 'N/A'}`);
    console.log(`   Year: ${newGame.year || 'N/A'}`);
    console.log(`   Players: ${newGame.min_players || '?'}-${newGame.max_players || '?'}`);
    console.log(`   Playtime: ${newGame.playtime_minutes || '?'} minutes`);
    console.log(`   Categories: ${newGame.game_category?.join(', ') || 'N/A'}`);
    console.log(`   Mechanics: ${newGame.game_mechanic?.join(', ') || 'N/A'}`);
    console.log(`   Cover Image: ${newGame.cover_image ? '✓' : 'N/A'}`);
    console.log('');

    // Step 6: Optionally add to user library
    const userId = process.env.USER_ID;
    if (userId) {
      console.log('Step 6: Adding to user library...');
      const { data: libraryEntry, error: libraryError } = await supabase
        .from('user_library')
        .insert({
          user_id: userId,
          game_id: newGame.id,
        })
        .select()
        .single();

      if (libraryError) {
        if (libraryError.code === '23505') {
          console.log('   ℹ️  Game already in user library');
        } else {
          console.error('   ❌ Failed to add to library:', libraryError);
        }
      } else {
        console.log('   ✅ Added to user library!');
        console.log(`   Library Entry ID: ${libraryEntry.id}`);
      }
    } else {
      console.log('💡 To add this game to your library, run:');
      console.log(`   USER_ID=<your-uuid> npm run test:add-game`);
    }

    console.log('');
    console.log('✨ Done!');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
