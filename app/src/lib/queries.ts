import type { GameComplete, GameType } from '$types';
import { CONFIG_GAMES } from '../config/games.config';
import { deleteEckchenGame } from './games/eckchen';
import { deleteWortigerGame } from './games/wortiger';

/**
 * Mock configuration to skip the deletion of game_state.
 * We do not have game_state in the mock data.
 */
export const SHOULD_DELETE_STATE = false;

/**
 * Get all games from the backend.
 * @returns all games
 */
export const getAllGames = async ({ gameName }: { gameName: GameType }) => {
  const URL = `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].apiEndpoint}?limit=100&order=release_date.desc`;
  console.log('Fetching all games from URL:', URL);

  const response = await fetch(URL);
  const data = await response.json();
  return data;
};

/**
 * deletes a game by its id along with all the questions associated with it and the game_state.
 * @param id the id of the game to be deleted
 * @returns the status of the deletion
 */
export const deleteGame = async (gameName: 'eckchen' | 'wortiger', id: number) => {
  if (gameName === 'eckchen') {
    return deleteEckchenGame(id);
  } else if (gameName === 'wortiger') {
    return deleteWortigerGame(id);
  } else {
    throw new Error(`Unsupported game type: ${gameName}`);
  }
};

/**
 * Updates a game by its id.
 * @param id - the id of the game to be updated
 * @param data - the data to be updated
 * @returns the updated game
 */
export const updateGame = async (gameName: GameType, id: number, data: GameComplete) => {
  try {
    const response = await fetch(
      `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].apiEndpoint}?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update game with id: ${id}. Status: ${response.status}`);
    }

    const updatedGame = await response.json();
    return updatedGame;
  } catch (error) {
    console.error('Failed to update the game', error);
    throw error;
  }
};

/**
 * Create a game.
 * @param data the data to be created
 * @returns the created game
 */
export async function createGame({
  gameName,
  data,
}: {
  gameName: GameType;
  data: GameComplete;
}): Promise<GameComplete[]> {
  const URL = `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].apiEndpoint}`;
  const game = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  return await game.json();
}

/**
 * Bulk insert games using PostgREST (JSON array).
 * Returns the inserted rows (Prefer: return=representation).
 * Optionally pass on_conflict columns if you want upsert.
 */
export async function createGamesBulk({
  gameName,
  rows,
  onConflict, // e.g. 'release_date,level'
}: {
  gameName: GameType;
  rows: Array<Partial<GameComplete> & Record<string, unknown>>;
  onConflict?: string;
}) {
  const base = `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].apiEndpoint}`;
  const url = onConflict ? `${base}?on_conflict=${encodeURIComponent(onConflict)}` : base;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Use `resolution=merge-duplicates` to upsert instead of insert-only
      // Remove it if you want pure inserts that error on duplicates.
      Prefer: onConflict
        ? 'resolution=merge-duplicates,return=representation'
        : 'return=representation',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    // PostgREST returns JSON error body — surface it
    let details = '';
    try {
      const err = await res.json();
      details = err?.message || JSON.stringify(err);
    } catch {
      details = 'Unknown error';
    }
    throw new Error(`Bulk insert failed (${res.status}): ${details}`);
  }

  return res.json();
}

/**
 * Get the next available date for a game.
 * @returns the next available date for a game in string format
 */
export const getNextAvailableDateForGame = async (gameName: GameType) => {
  const URL = `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].apiEndpoint}?select=release_date&order=release_date.desc&limit=1`;
  const response = await fetch(URL);
  const data = await response.json();
  console.log('Next available date for game:', data);

  // if latest available date is in the past, return today's date
  const isDateInThePast = data[0].release_date < new Date().toISOString().split('T')[0];
  if (isDateInThePast) {
    return new Date().toISOString().split('T')[0];
  }

  return data[0].release_date;
};
