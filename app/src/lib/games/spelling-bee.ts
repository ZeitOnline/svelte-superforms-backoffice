import { CONFIG_GAMES } from '$config/games.config';
import type { GameType } from '$types';
import type { LoadEvent } from '@sveltejs/kit';

/**
 * Get all game solutions from the backend.
 * @returns all solutions for a given game type
 */
export const getAllGameSolutions = async ({
  gameName,
  fetch,
  limit = 100
}: {
  gameName: GameType;
  fetch: LoadEvent['fetch'];
  limit?: number;
}) => {
  const config = CONFIG_GAMES[gameName];

  if (!config.endpoints?.solutions) {
    console.warn(`No solutions endpoint found for game "${gameName}".`);
    return [];
  }

  const URL = `${config.apiBase}/${config.endpoints.solutions.name}?limit=${limit}&order=id.asc`;

  const response = await fetch(URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch solutions for ${gameName}. Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};


/**
 * Utility to group solutions by game_id.
 */
export function groupSolutionsByGameId(solutions: Array<{ game_id: number; solution: string; points: number }>) {
  return solutions.reduce<Record<number, { solution: string; points: number }[]>>((acc, item) => {
    if (!acc[item.game_id]) acc[item.game_id] = [];
    acc[item.game_id].push({ solution: item.solution, points: item.points });
    return acc;
  }, {});
}
