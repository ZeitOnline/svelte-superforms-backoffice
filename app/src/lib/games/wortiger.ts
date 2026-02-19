import { CONFIG_GAMES } from '../../config/games.config';
import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';
import type { GameComplete } from '$types';

/**
 * The characters per level in the Wortiger game.
 */
export const MAP_LEVEL_CHARACTERS: Record<number, number> = {
  1: 7,
  2: 6,
  3: 5,
  4: 4,
};

export const WORTIGER_LENGTHS = Object.values(MAP_LEVEL_CHARACTERS).sort((a, b) => a - b);

export const LENGTH_TO_LEVEL: Record<number, number> = Object.fromEntries(
  Object.entries(MAP_LEVEL_CHARACTERS).map(([level, length]) => [Number(length), Number(level)]),
);

export const isWortigerLength = (length: number): length is (typeof WORTIGER_LENGTHS)[number] =>
  WORTIGER_LENGTHS.includes(length);

const deleteWortigerGameById = async (id: number) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES['wortiger'].apiBase,
    path: CONFIG_GAMES['wortiger'].endpoints.games.name,
    method: 'DELETE',
    query: buildQueryParams([['id', pg.eq(id)]]),
    errorMessage: `Failed to delete Wortiger game with id: ${id}`,
  });

const updateWortigerGameById = async (id: number, data: Partial<GameComplete>) =>
  requestPostgrest<GameComplete[], Partial<GameComplete>>({
    baseUrl: CONFIG_GAMES.wortiger.apiBase,
    path: CONFIG_GAMES.wortiger.endpoints.games.name,
    method: 'PATCH',
    query: buildQueryParams([['id', pg.eq(id)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: `Failed to update game with id: ${id}`,
  });

const createWortigerGameRow = async (data: GameComplete) =>
  requestPostgrest<GameComplete[], GameComplete>({
    baseUrl: CONFIG_GAMES.wortiger.apiBase,
    path: CONFIG_GAMES.wortiger.endpoints.games.name,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create game',
  });

export const deleteWortigerGame = async (id: number) => {
  try {
    const { response } = await deleteWortigerGameById(id);

    console.log(`Successfully deleted Wortiger game with id: ${id}`);
    return response.statusText;
  } catch (error) {
    console.error('Error deleting Wortiger game:', error);
    throw error;
  }
};

export const updateWortigerGame = async ({
  gameId,
  data,
}: {
  gameId: number;
  data: Partial<GameComplete>;
}) => {
  const { data: updatedGame } = await updateWortigerGameById(gameId, data);
  return updatedGame;
};

export async function createWortigerGame(data: GameComplete): Promise<GameComplete[]> {
  const { data: game } = await createWortigerGameRow(data);
  return game;
}
