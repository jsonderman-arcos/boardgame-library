import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkLure() {
  const { data, error } = await supabase
    .from('shared_games')
    .select('id, name, barcode, publisher, year, bgg_id')
    .ilike('name', 'lure');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} "Lure" entry(ies):\n`);

  data.forEach((game, idx) => {
    console.log(`${idx + 1}. ${game.name}`);
    console.log(`   ID: ${game.id}`);
    console.log(`   Barcode: ${game.barcode}`);
    console.log(`   Publisher: ${game.publisher}`);
    console.log(`   Year: ${game.year}`);
    console.log(`   BGG ID: ${game.bgg_id}`);
    console.log();
  });
}

checkLure();
