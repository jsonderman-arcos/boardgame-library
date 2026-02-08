/**
 * Test script for manual entry flow when barcode lookup fails
 * This simulates:
 * 1. Barcode lookup returns "Unknown Game"
 * 2. User types game name manually
 * 3. BGG search finds the game
 * 4. Game is added with barcode + BGG data
 * 5. Barcode mapping is submitted to GameUPC
 *
 * Usage: npx tsx test-manual-entry.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test barcode that should fail (fake barcode)
const TEST_BARCODE = '999999999999';
const TEST_GAME_NAME = 'Catan';

async function testManualEntryFlow() {
  console.log('🧪 Testing Manual Entry Flow');
  console.log('================================\n');

  // Step 1: Simulate barcode lookup failure
  console.log('📡 Step 1: Test barcode lookup with fake barcode');
  console.log(`Barcode: ${TEST_BARCODE}\n`);

  try {
    const { data: barcodeData, error: barcodeError } = await supabase.functions.invoke('barcode-lookup', {
      body: { barcode: TEST_BARCODE },
    });

    if (barcodeError || !barcodeData || barcodeData.name === 'Unknown Game') {
      console.log('✓ Barcode lookup failed as expected (would trigger manual entry)');
      console.log(`Response: ${JSON.stringify(barcodeData || barcodeError)}\n`);
    } else {
      console.log('⚠️  Barcode lookup unexpectedly succeeded');
      console.log(`Response: ${JSON.stringify(barcodeData)}\n`);
    }
  } catch (err) {
    console.log('✓ Barcode lookup threw error (would trigger manual entry)');
    console.log(`Error: ${err}\n`);
  }

  // Step 2: Simulate manual BGG search
  console.log('📡 Step 2: Manual BGG Search');
  console.log(`User types: "${TEST_GAME_NAME}"\n`);

  try {
    const { data: searchData, error: searchError } = await supabase.functions.invoke('bgg-lookup', {
      body: { searchName: TEST_GAME_NAME },
    });

    if (searchError) {
      console.error('❌ BGG search failed:', searchError);
      return;
    }

    console.log(`✅ BGG search succeeded! Found ${searchData.results.length} result(s):`);
    searchData.results.slice(0, 3).forEach((result: any, idx: number) => {
      console.log(`  ${idx + 1}. ${result.name} (${result.year}) - BGG ID: ${result.bgg_id}`);
    });
    console.log();

    // Step 3: Fetch details for first result
    const selectedGame = searchData.results[0];
    console.log('📡 Step 3: Fetch full game details');
    console.log(`Selected: ${selectedGame.name} (BGG ID: ${selectedGame.bgg_id})\n`);

    const { data: detailsData, error: detailsError } = await supabase.functions.invoke('bgg-lookup', {
      body: { bggId: selectedGame.bgg_id },
    });

    if (detailsError) {
      console.error('❌ BGG details lookup failed:', detailsError);
      return;
    }

    console.log('✅ BGG details retrieved successfully!');
    console.log(`Name: ${detailsData.name}`);
    console.log(`Year: ${detailsData.year}`);
    console.log(`Publisher: ${detailsData.publisher}`);
    console.log(`Players: ${detailsData.min_players}-${detailsData.max_players}`);
    console.log();

    // Step 4: Simulate submitting barcode mapping to GameUPC
    console.log('📡 Step 4: Submit barcode mapping to GameUPC');
    console.log(`Barcode: ${TEST_BARCODE} -> BGG ID: ${selectedGame.bgg_id}\n`);

    try {
      const { data: submitData, error: submitError } = await supabase.functions.invoke('submit-barcode-mapping', {
        body: {
          barcode: TEST_BARCODE,
          bggId: selectedGame.bgg_id
        },
      });

      if (submitError) {
        console.log('⚠️  Failed to submit barcode mapping (may not have API key)');
        console.log(`Error: ${JSON.stringify(submitError)}\n`);
      } else {
        console.log('✅ Barcode mapping submitted successfully!');
        console.log(`Response: ${JSON.stringify(submitData)}\n`);
      }
    } catch (submitErr) {
      console.log('⚠️  Error submitting barcode mapping (non-fatal)');
      console.log(`Error: ${submitErr}\n`);
    }

    // Summary
    console.log('\n📊 MANUAL ENTRY FLOW SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`✓ Barcode lookup failed (as expected)`);
    console.log(`✓ Manual BGG search: SUCCESS`);
    console.log(`✓ BGG details fetch: SUCCESS`);
    console.log(`✓ Game data ready to save with:`);
    console.log(`  - Barcode: ${TEST_BARCODE}`);
    console.log(`  - BGG ID: ${selectedGame.bgg_id}`);
    console.log(`  - Full game details from BGG`);
    console.log(`✓ Barcode mapping submission attempted`);
    console.log();
    console.log('🎉 Manual entry flow test complete!\n');

  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testManualEntryFlow();
