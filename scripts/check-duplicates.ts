import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkDuplicates() {
  console.log('Checking for duplicates in shared_games...\n');

  // Check for duplicate barcodes
  const { data: barcodeData, error: barcodeError } = await supabase
    .from('shared_games')
    .select('barcode, name, id');

  if (barcodeError) {
    console.error('Error fetching games:', barcodeError);
    return;
  }

  // Group by barcode
  const barcodeGroups = new Map<string, any[]>();
  barcodeData?.forEach((game) => {
    if (!barcodeGroups.has(game.barcode)) {
      barcodeGroups.set(game.barcode, []);
    }
    barcodeGroups.get(game.barcode)!.push(game);
  });

  // Find duplicates
  const duplicateBarcodes = Array.from(barcodeGroups.entries())
    .filter(([_, games]) => games.length > 1);

  console.log(`Total games: ${barcodeData?.length}`);
  console.log(`Unique barcodes: ${barcodeGroups.size}`);
  console.log(`Duplicate barcodes: ${duplicateBarcodes.length}\n`);

  if (duplicateBarcodes.length > 0) {
    console.log('Duplicate entries by barcode:');
    duplicateBarcodes.forEach(([barcode, games]) => {
      console.log(`\nBarcode: ${barcode} (${games.length} entries)`);
      games.forEach((game, idx) => {
        console.log(`  ${idx + 1}. ${game.name} (ID: ${game.id})`);
      });
    });
  }

  // Check for duplicate names (case-insensitive)
  const nameGroups = new Map<string, any[]>();
  barcodeData?.forEach((game) => {
    const normalizedName = game.name.toLowerCase().trim();
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    nameGroups.get(normalizedName)!.push(game);
  });

  const duplicateNames = Array.from(nameGroups.entries())
    .filter(([_, games]) => games.length > 1);

  console.log(`\n\nDuplicate names: ${duplicateNames.length}`);
  if (duplicateNames.length > 0) {
    console.log('\nDuplicate entries by name:');
    duplicateNames.slice(0, 10).forEach(([name, games]) => {
      console.log(`\nName: "${name}" (${games.length} entries)`);
      games.forEach((game, idx) => {
        console.log(`  ${idx + 1}. Barcode: ${game.barcode}, ID: ${game.id}`);
      });
    });
    if (duplicateNames.length > 10) {
      console.log(`\n... and ${duplicateNames.length - 10} more`);
    }
  }
}

checkDuplicates();
