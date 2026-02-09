import { supabase } from './supabase';
import { updateProfile } from './auth';

/**
 * Get all saved player names for a user
 */
export async function getPlayers(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.preferences?.players || [];
}

/**
 * Save the complete player list for a user
 */
export async function savePlayers(userId: string, players: string[]): Promise<void> {
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  await updateProfile(userId, {
    preferences: {
      ...currentProfile?.preferences,
      players,
    },
  });
}

/**
 * Add a single player to the user's list
 * Prevents duplicates (case-insensitive)
 */
export async function addPlayer(userId: string, playerName: string): Promise<string[]> {
  const trimmedName = playerName.trim();

  if (!trimmedName) {
    throw new Error('Player name cannot be empty');
  }

  if (trimmedName.length > 30) {
    throw new Error('Player name must be 30 characters or less');
  }

  const players = await getPlayers(userId);

  // Check for duplicate (case-insensitive)
  const isDuplicate = players.some(
    p => p.toLowerCase() === trimmedName.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error('Player name already exists');
  }

  const updatedPlayers = [...players, trimmedName];
  await savePlayers(userId, updatedPlayers);
  return updatedPlayers;
}

/**
 * Remove a player from the user's list
 */
export async function removePlayer(userId: string, playerName: string): Promise<string[]> {
  const players = await getPlayers(userId);
  const updatedPlayers = players.filter(p => p !== playerName);
  await savePlayers(userId, updatedPlayers);
  return updatedPlayers;
}
