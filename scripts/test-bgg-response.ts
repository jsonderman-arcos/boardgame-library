import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testBggResponse() {
  console.log('Testing BGG edge function response...\n');

  const { data, error } = await supabase.functions.invoke('bgg-lookup', {
    body: { bggId: 266192 }, // Wingspan BGG ID
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('BGG Response:');
  console.log('name:', data.name);
  console.log('game_type:', data.game_type);
  console.log('game_family:', data.game_family);
  console.log('\ngame_type length:', data.game_type?.length || 0);
  console.log('game_family length:', data.game_family?.length || 0);
}

testBggResponse();
