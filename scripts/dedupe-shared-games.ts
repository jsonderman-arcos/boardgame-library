import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function dedupeSharedGames() {
  console.log('Starting deduplication of shared_games...\n');

  // The two duplicate Lure entries
  const keepId = '2e6b635f-3ca1-496a-990c-4c90f609b4db'; // Barcode: 618149323746
  const deleteId = 'b81412d9-9293-4377-93f4-8f0a8e50410e'; // Barcode: 8681493237467

  console.log('Plan:');
  console.log(`  KEEP: ID ${keepId} (Barcode: 618149323746)`);
  console.log(`  DELETE: ID ${deleteId} (Barcode: 8681493237467)\n`);

  // Check one more time for user_library references
  const { data: libraryRefs, error: libError } = await supabase
    .from('user_library')
    .select('id, game_id')
    .in('game_id', [keepId, deleteId]);

  if (libError) {
    console.error('Error checking user_library:', libError);
    return;
  }

  if (libraryRefs && libraryRefs.length > 0) {
    console.log('Found user_library references:');
    console.log(libraryRefs);
    console.log('\nWARNING: Need to migrate these references first!');

    // Migrate references if any exist
    const toMigrate = libraryRefs.filter(ref => ref.game_id === deleteId);
    if (toMigrate.length > 0) {
      console.log(`\nMigrating ${toMigrate.length} user_library entries...`);
      for (const ref of toMigrate) {
        const { error: updateError } = await supabase
          .from('user_library')
          .update({ game_id: keepId })
          .eq('id', ref.id);

        if (updateError) {
          console.error(`Error updating user_library entry ${ref.id}:`, updateError);
          return;
        }
        console.log(`  Migrated user_library entry ${ref.id}`);
      }
    }
  } else {
    console.log('No user_library references to migrate.\n');
  }

  // Delete the duplicate entry
  console.log(`Deleting duplicate entry ${deleteId}...`);
  const { error: deleteError } = await supabase
    .from('shared_games')
    .delete()
    .eq('id', deleteId);

  if (deleteError) {
    console.error('Error deleting duplicate:', deleteError);
    return;
  }

  console.log('✓ Successfully deleted duplicate entry');

  // Verify deletion
  const { data: remaining, error: verifyError } = await supabase
    .from('shared_games')
    .select('id, name, barcode')
    .ilike('name', 'lure');

  if (verifyError) {
    console.error('Error verifying:', verifyError);
    return;
  }

  console.log('\nRemaining "Lure" entries:');
  remaining?.forEach(game => {
    console.log(`  - ${game.name} (Barcode: ${game.barcode}, ID: ${game.id})`);
  });

  console.log('\n✓ Deduplication complete!');
}

dedupeSharedGames();
