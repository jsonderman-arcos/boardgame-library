import { supabase } from './supabase';
import { updateProfile } from './auth';

export interface GameTimerState {
  started_at: string | null;
  stopped_at: string | null;
  is_running: boolean;
}

export async function getGameTimer(userId: string): Promise<GameTimerState | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.preferences?.game_timer ?? null;
}

export async function saveGameTimer(userId: string, timer: GameTimerState): Promise<void> {
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  await updateProfile(userId, {
    preferences: {
      ...(currentProfile?.preferences || {}),
      game_timer: timer,
    },
  });
}
