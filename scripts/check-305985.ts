import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkGame() {
  const { data, error } = await supabase
    .from('shared_games')
    .select('*')
    .eq('bgg_id', 305985)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Game in database with BGG ID 305985:\n');
  console.log('ID:', data.id);
  console.log('Name:', data.name);
  console.log('Barcode:', data.barcode);
  console.log('BGG ID:', data.bgg_id);
  console.log('Publisher:', data.publisher);
  console.log('Year:', data.year);
  console.log('Cover Image:', data.cover_image);
  console.log('Created:', data.created_at);
}

checkGame();
