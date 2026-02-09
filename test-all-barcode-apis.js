#!/usr/bin/env node

// Test script to check all three barcode lookup APIs independently
// Tests barcode: 3558380020400
// Does not save any data to the database

import dotenv from 'dotenv';

dotenv.config();

const BARCODE_ORIGINAL = '3558380020400';
const BARCODE_FORMATTED = BARCODE_ORIGINAL; // Already 13 digits, no formatting needed

// Load environment variables
const GAMEUPC_API_KEY = process.env.UPCGAME_API_KEY || process.env.GAMEUPC_API_KEY;
const BARCODELOOKUP_API_KEY = process.env.BARCODELOOKUP_API_KEY;
const UPCITEMDB_USER_KEY = process.env.UPCITEMDB_USER_KEY;
const UPCITEMDB_KEY_TYPE = process.env.UPCITEMDB_KEY_TYPE || '3scale';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

async function testGameUpc() {
  try {
    console.log('\n=== Testing GameUPC ===');
    
    if (!GAMEUPC_API_KEY) {
      console.error('❌ GAMEUPC_API_KEY not configured');
      return { success: false, error: 'API key not configured' };
    }

    const response = await fetch(`https://api.gameupc.com/v1/upc/${BARCODE_ORIGINAL}`, {
      headers: {
        'x-api-key': GAMEUPC_API_KEY,
      },
    });

    console.log(`Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ GameUPC API error: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    const gameMatch = result.bgg_info?.[0];
    const name = gameMatch?.name?.trim();

    if (isNonEmptyString(name)) {
      console.log(`✅ GameUPC SUCCESS`);
      console.log(`   Name: ${name}`);
      console.log(`   BGG ID: ${gameMatch?.id || 'N/A'}`);
      return { success: true, data: { name, bgg_id: gameMatch?.id } };
    } else {
      console.log(`❌ GameUPC returned no valid game name`);
      console.log(`   Raw response:`, JSON.stringify(result, null, 2));
      return { success: false, error: 'No valid game name in response' };
    }
  } catch (error) {
    console.error(`❌ GameUPC error:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function testBarcodeLookup() {
  try {
    console.log('\n=== Testing BarcodeLookup ===');

    if (!BARCODELOOKUP_API_KEY) {
      console.error('❌ BARCODELOOKUP_API_KEY not configured');
      return { success: false, error: 'API key not configured' };
    }

    const response = await fetch(
      `https://api.barcodelookup.com/v3/products?barcode=${BARCODE_ORIGINAL}&formatted=y&key=${BARCODELOOKUP_API_KEY}`
    );

    console.log(`Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ BarcodeLookup API error: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    const product = result.products?.[0];
    const name = product?.title?.trim();

    if (isNonEmptyString(name)) {
      console.log(`✅ BarcodeLookup SUCCESS`);
      console.log(`   Title: ${name}`);
      console.log(`   Brand: ${product?.brand || 'N/A'}`);
      console.log(`   Description: ${product?.description?.substring(0, 60) || 'N/A'}...`);
      return { success: true, data: { name, brand: product?.brand, description: product?.description } };
    } else {
      console.log(`❌ BarcodeLookup returned no valid product`);
      console.log(`   Raw response:`, JSON.stringify(result, null, 2));
      return { success: false, error: 'No valid product in response' };
    }
  } catch (error) {
    console.error(`❌ BarcodeLookup error:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function testUpcItemDb() {
  try {
    console.log('\n=== Testing UPCItemDB ===');

    const endpoint = UPCITEMDB_USER_KEY
      ? 'https://api.upcitemdb.com/prod/v1/lookup'
      : 'https://api.upcitemdb.com/prod/trial/lookup';

    const headers = {
      Accept: 'application/json',
    };

    if (UPCITEMDB_USER_KEY) {
      headers.user_key = UPCITEMDB_USER_KEY;
      headers.key_type = UPCITEMDB_KEY_TYPE;
      console.log(`Using authenticated endpoint: ${endpoint}`);
    } else {
      console.log(`Using trial endpoint: ${endpoint}`);
    }

    // Try with formatted barcode (12 digits with leading zero)
    console.log(`Testing with formatted barcode: ${BARCODE_FORMATTED}`);
    const response = await fetch(`${endpoint}?upc=${BARCODE_FORMATTED}`, { headers });

    console.log(`Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ UPCItemDB API error: ${response.status}`);
      console.error(`   Error response: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    const item = result.items?.[0];
    const name = item?.title?.trim();

    if (isNonEmptyString(name)) {
      console.log(`✅ UPCItemDB SUCCESS`);
      console.log(`   Title: ${name}`);
      console.log(`   Brand: ${item?.brand || 'N/A'}`);
      console.log(`   Description: ${item?.description?.substring(0, 60) || 'N/A'}...`);
      return { success: true, data: { name, brand: item?.brand, description: item?.description } };
    } else {
      console.log(`❌ UPCItemDB returned no valid item`);
      console.log(`   Raw response:`, JSON.stringify(result, null, 2));
      return { success: false, error: 'No valid item in response' };
    }
  } catch (error) {
    console.error(`❌ UPCItemDB error:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  console.log('🛍️  Barcode Lookup API Test Suite');
  console.log('================================');
  console.log(`Testing barcode (original):    ${BARCODE_ORIGINAL}`);
  console.log(`Testing barcode (formatted):   ${BARCODE_FORMATTED} (with leading zero)`);
  console.log('Note: This test does NOT save any data to the database\n');

  const results = {
    gameUpc: await testGameUpc(),
    barcodeLookup: await testBarcodeLookup(),
    upcItemDb: await testUpcItemDb(),
  };

  console.log('\n\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`GameUPC:          ${results.gameUpc.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (!results.gameUpc.success) console.log(`  Error: ${results.gameUpc.error}`);
  console.log(`BarcodeLookup:    ${results.barcodeLookup.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (!results.barcodeLookup.success) console.log(`  Error: ${results.barcodeLookup.error}`);
  console.log(`UPCItemDB:        ${results.upcItemDb.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (!results.upcItemDb.success) console.log(`  Error: ${results.upcItemDb.error}`);

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\nTotal: ${successCount}/3 APIs succeeded`);
}

main();
