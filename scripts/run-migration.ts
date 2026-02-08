import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function runMigration() {
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20260208_rename_game_mechanism_to_game_mechanic.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Running migration: rename game_mechanism to game_mechanic');
  console.log('SQL:', sql);

  // Execute the SQL directly
  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('Migration failed:', error);

    // Try a simpler approach - just rename the column directly
    console.log('\nTrying direct column rename...');
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE shared_games RENAME COLUMN game_mechanism TO game_mechanic;'
    });

    if (renameError) {
      console.error('Direct rename also failed:', renameError);
      console.log('\nTrying with psql...');
      process.exit(1);
    } else {
      console.log('✓ Column renamed successfully!');
    }
  } else {
    console.log('✓ Migration completed successfully!');
    console.log('Result:', data);
  }
}

runMigration().catch(console.error);
