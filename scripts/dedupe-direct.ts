import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

// You need to use the service role key for this operation
// Get it from: https://supabase.com/dashboard/project/oorilcytrytxhffindgy/settings/api
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('\nTo run this script, you need to:');
  console.log('1. Get your service role key from:');
  console.log('   https://supabase.com/dashboard/project/oorilcytrytxhffindgy/settings/api');
  console.log('2. Add it to your .env file: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('3. Run this script again');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function dedupeDirect() {
  console.log('Running deduplication with service role key...\n');

  const deleteId = 'b81412d9-9293-4377-93f4-8f0a8e50410e';

  // Verify no user_library references
  const { data: refs, error: refError } = await supabase
    .from('user_library')
    .select('id')
    .eq('game_id', deleteId);

  if (refError) {
    console.error('Error checking references:', refError);
    return;
  }

  if (refs && refs.length > 0) {
    console.error(`Cannot delete: ${refs.length} user_library references exist`);
    return;
  }

  console.log('✓ No user_library references found');

  // Delete the duplicate
  const { error: deleteError } = await supabase
    .from('shared_games')
    .delete()
    .eq('id', deleteId);

  if (deleteError) {
    console.error('Error deleting duplicate:', deleteError);
    return;
  }

  console.log('✓ Successfully deleted duplicate entry');

  // Verify
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
    console.log(`  - ${game.name} (Barcode: ${game.barcode})`);
  });

  console.log(`\nTotal: ${remaining?.length} entry(ies)`);
  console.log('\n✓ Deduplication complete!');
}

dedupeDirect();
