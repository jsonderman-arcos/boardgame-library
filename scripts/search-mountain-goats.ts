import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function searchGame() {
  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { searchName: 'Mountain Goats' },
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('BGG Search Results for "Mountain Goats":\n');
  data.results.forEach((result: any, index: number) => {
    console.log(`${index + 1}. ${result.name} (${result.year}) - BGG ID: ${result.bgg_id}`);
  });
}

searchGame();
