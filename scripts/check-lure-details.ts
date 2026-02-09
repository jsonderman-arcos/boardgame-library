import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkLureDetails() {
  const ids = [
    '2e6b635f-3ca1-496a-990c-4c90f609b4db',
    'b81412d9-9293-4377-93f4-8f0a8e50410e'
  ];

  console.log('Details for "Lure" entries:\n');

  for (const id of ids) {
    const { data, error } = await supabase
      .from('shared_games')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error:', error);
      continue;
    }

    console.log('---');
    console.log(`ID: ${data.id}`);
    console.log(`Barcode: ${data.barcode}`);
    console.log(`Name: ${data.name}`);
    console.log(`Publisher: ${data.publisher}`);
    console.log(`Year: ${data.year}`);
    console.log(`Edition: ${data.edition}`);
    console.log(`Cover Image: ${data.cover_image ? 'Yes' : 'No'}`);
    console.log(`BGG ID: ${data.bgg_id || 'None'}`);
    console.log(`Game Type: ${data.game_type || []}`);
    console.log(`Game Category: ${data.game_category || []}`);
    console.log(`Game Mechanic: ${data.game_mechanic || []}`);
    console.log(`Game Family: ${data.game_family || []}`);
    console.log(`Created: ${data.created_at}`);
    console.log(`Updated: ${data.updated_at}`);
    console.log();
  }

  // Check if either is referenced in user_library
  console.log('Checking user_library references:\n');

  for (const id of ids) {
    const { data, error } = await supabase
      .from('user_library')
      .select('id, user_id')
      .eq('game_id', id);

    if (error) {
      console.error('Error:', error);
      continue;
    }

    console.log(`Game ID ${id}: ${data.length} user_library entries`);
  }
}

checkLureDetails();
