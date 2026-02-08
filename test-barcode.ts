/**
 * Test script for barcode lookup with detailed API logging
 * Usage: npx tsx test-barcode.ts
 */

import { createClient } from '@supabase/supabase-js';

const BARCODE = '689521156658';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBarcodeAPIs() {
  console.log('🔍 Testing Barcode Lookup APIs');
  console.log('================================\n');
  console.log(`Barcode: ${BARCODE}\n`);

  // Step 1: Test barcode lookup (tries all APIs)
  console.log('📡 Step 1: Barcode Lookup (GameUPC → BarcodeLookup → UPCItemDB)');
  console.log('─────────────────────────────────────────────────────────────────\n');

  try {
    const { data: barcodeData, error: barcodeError } = await supabase.functions.invoke('barcode-lookup', {
      body: { barcode: BARCODE },
    });

    if (barcodeError) {
      console.error('❌ Barcode lookup failed:', barcodeError);
      console.error('Error details:', barcodeError.message);
      return;
    }

    console.log('✅ Barcode lookup succeeded!');
    console.log(`Source: ${barcodeData.source}`);
    console.log(`Title: ${barcodeData.name}`);
    if (barcodeData.bgg_id) {
      console.log(`BGG ID (from ${barcodeData.source}): ${barcodeData.bgg_id}`);
    }
    if (barcodeData.brand) {
      console.log(`Brand: ${barcodeData.brand}`);
    }
    console.log('Full response:', JSON.stringify(barcodeData, null, 2));
    console.log();

    const gameTitle = barcodeData.name;
    const sourceBggId = barcodeData.bgg_id;

    // Step 2: Search BGG by title
    if (gameTitle && gameTitle !== 'Unknown Game') {
      console.log('📡 Step 2: BGG Search by Title');
      console.log('─────────────────────────────────────────────────────────────────\n');
      console.log(`Searching BGG for: "${gameTitle}"\n`);

      try {
        const { data: searchData, error: searchError } = await supabase.functions.invoke('bgg-lookup', {
          body: { searchName: gameTitle },
        });

        if (searchError) {
          console.error('❌ BGG search failed:', searchError);
          console.error('Error details:', searchError.message);
        } else if (searchData.results && searchData.results.length > 0) {
          console.log(`✅ BGG search succeeded! Found ${searchData.results.length} result(s):`);
          searchData.results.forEach((result: any, idx: number) => {
            console.log(`  ${idx + 1}. ${result.name} (${result.year}) - BGG ID: ${result.bgg_id}`);
          });
          console.log();

          // Step 3: Fetch full details from BGG
          const bggIdToUse = sourceBggId || searchData.results[0].bgg_id;
          console.log('📡 Step 3: BGG Full Details Lookup');
          console.log('─────────────────────────────────────────────────────────────────\n');
          console.log(`Fetching details for BGG ID: ${bggIdToUse}\n`);

          try {
            const { data: detailsData, error: detailsError } = await supabase.functions.invoke('bgg-lookup', {
              body: { bggId: bggIdToUse },
            });

            if (detailsError) {
              console.error('❌ BGG details lookup failed:', detailsError);
              console.error('Error details:', detailsError.message);
            } else {
              console.log('✅ BGG details lookup succeeded!');
              console.log(`Name: ${detailsData.name}`);
              console.log(`Year: ${detailsData.year}`);
              console.log(`Publisher: ${detailsData.publisher}`);
              console.log(`Players: ${detailsData.min_players}-${detailsData.max_players}`);
              console.log(`Playtime: ${detailsData.playtime_minutes} minutes`);
              console.log(`Min Age: ${detailsData.min_age}+`);
              console.log(`Categories: ${detailsData.game_category?.join(', ') || 'N/A'}`);
              console.log(`Mechanics: ${detailsData.game_mechanism?.join(', ') || 'N/A'}`);
              if (detailsData.cover_image) {
                console.log(`Cover Image: ${detailsData.cover_image}`);
              }
              if (detailsData.description) {
                console.log(`Description: ${detailsData.description.substring(0, 200)}...`);
              }
              console.log();
            }
          } catch (detailsErr) {
            console.error('❌ Exception during BGG details lookup:', detailsErr);
          }
        } else {
          console.log('⚠️  BGG search returned no results');
          console.log('The title may not match any board game in BGG database');
          console.log();
        }
      } catch (searchErr) {
        console.error('❌ Exception during BGG search:', searchErr);
      }
    } else {
      console.log('⚠️  Skipping BGG search - no valid game title from barcode lookup');
      console.log();
    }

    // Final summary
    console.log('\n📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`✓ Barcode API Source: ${barcodeData.source}`);
    console.log(`✓ Title Retrieved: ${gameTitle}`);
    console.log(`✓ Can be used for BGG lookup: ${gameTitle && gameTitle !== 'Unknown Game' ? 'YES ✅' : 'NO ❌'}`);
    if (sourceBggId) {
      console.log(`✓ BGG ID from barcode API: ${sourceBggId}`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
testBarcodeAPIs();
